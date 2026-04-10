import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { initDb, db } from './database/db';
import { accountRepository } from './database/account.repository';
import { noteRepository } from './database/note.repository';
import { banRepository } from './database/ban.repository';
import { userRepository } from './database/user.repository';

let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        frame: false,
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.setMenuBarVisibility(false);

    if (isDev) {
        mainWindow.loadURL('http://localhost:5123');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // Initialize SQLite database table schemas
    initDb();

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.whenReady().then(() => {
    const unbanIntervalMs = 1000;
    setInterval(() => {
        banRepository.expireDueBans();
    }, unbanIntervalMs);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ========================
// IPC Handlers
// ========================

// Accounts
ipcMain.handle('accounts:create', (_, account) => accountRepository.create(account));
ipcMain.handle('accounts:update', (_, id, account) => accountRepository.update(id, account));
ipcMain.handle('accounts:delete', (_, id) => accountRepository.delete(id));
ipcMain.handle('accounts:getAll', (_, filters) => accountRepository.getAll(filters));
ipcMain.handle('accounts:getById', (_, id) => accountRepository.getById(id));
ipcMain.handle('accounts:getStats', () => accountRepository.getStats());

// Notes
ipcMain.handle('notes:create', (_, note) => noteRepository.create(note));
ipcMain.handle('notes:update', (_, id, note) => noteRepository.update(id, note));
ipcMain.handle('notes:delete', (_, id) => noteRepository.delete(id));
ipcMain.handle('notes:getByAccountId', (_, id) => noteRepository.getByAccountId(id));

// Bans
ipcMain.handle('bans:create', (_, ban) => banRepository.create(ban));
ipcMain.handle('bans:update', (_, id, ban) => banRepository.update(id, ban));
ipcMain.handle('bans:updateActiveStatus', (_, id, isActive) => banRepository.updateActiveStatus(id, isActive));
ipcMain.handle('bans:delete', (_, id) => banRepository.delete(id));
ipcMain.handle('bans:getByAccountId', (_, id) => banRepository.getByAccountId(id));

// System Utilities
ipcMain.handle('system:exportCSV', async () => {
    if (!mainWindow) return { success: false, error: 'No main window' };

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Accounts to CSV',
        defaultPath: 'accounts_export.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (filePath) {
        try {
            // Get all accounts, no filters
            const accounts = accountRepository.getAll() as any[];
            const csvLines = ['id,email,username,status,created_at'];
            for (const acc of accounts) {
                csvLines.push(`${acc.id},${acc.email},${acc.username || ''},${acc.status},${acc.created_at}`);
            }
            fs.writeFileSync(filePath, csvLines.join('\n'));
            return { success: true, path: filePath };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
    return { success: false, cancelled: true };
});

ipcMain.handle('system:importCSV', async () => {
    if (!mainWindow) return { success: false, error: 'No main window' };

    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Accounts from CSV',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        try {
            const content = fs.readFileSync(filePaths[0], 'utf-8');
            const lines = content.split('\n');
            if (lines.length <= 1) return { success: false, error: 'Empty CSV or invalid format.' };

            let imported = 0;
            // Skip header (i=1)
            db.prepare('BEGIN').run();
            try {
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const parts = line.split(',');
                    // format: id,email,username,status,created_at for exports, but let's just handle email,username,status at minimum
                    // For simplicity, we assume an import CSV has: email,username,password (defaults to empty string, user should reset)
                    // Since the prompt just says "Import accounts from CSV", a basic import will do.
                    let email = parts[1] || parts[0];
                    let username = parts[2] || parts[1] || 'Imported User';

                    if (email && email.includes('@')) {
                        accountRepository.create({
                            email: email,
                            password: 'imported-no-password',
                            username: username,
                            status: 'Active'
                        });
                        imported++;
                    }
                }
                db.prepare('COMMIT').run();
                return { success: true, count: imported };
            } catch (err) {
                db.prepare('ROLLBACK').run();
                throw err;
            }
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
    return { success: false, cancelled: true };
});

ipcMain.handle('system:backupDatabase', async () => {
    if (!mainWindow) return { success: false, error: 'No main window' };

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Backup Database',
        defaultPath: 'manager-data-backup.db',
        filters: [{ name: 'SQLite DB', extensions: ['db', 'sqlite'] }]
    });

    if (filePath) {
        try {
            const srcDbPath = process.env.NODE_ENV === 'development'
                ? path.join(__dirname, '../../data.db')
                : path.join(app.getPath('userData'), 'manager-data.db');

            db.backup(filePath);
            return { success: true, path: filePath };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
    return { success: false, cancelled: true };
});

// App User / Lock
ipcMain.handle('appUser:hasUsers', () => userRepository.hasUsers());
ipcMain.handle('appUser:register', (_, payload: { username: string; password: string }) => {
    return userRepository.create(payload.username, payload.password);
});
ipcMain.handle('appUser:verify', (_, payload: { username: string; password: string }) => {
    return userRepository.verify(payload.username, payload.password);
});

// Window Controls
ipcMain.handle('window:minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.handle('window:close', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});
