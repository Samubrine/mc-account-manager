import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    // Accounts
    createAccount: (account: any) => ipcRenderer.invoke('accounts:create', account),
    updateAccount: (id: number, account: any) => ipcRenderer.invoke('accounts:update', id, account),
    deleteAccount: (id: number) => ipcRenderer.invoke('accounts:delete', id),
    getAccounts: (filters?: any) => ipcRenderer.invoke('accounts:getAll', filters),
    getAccountById: (id: number) => ipcRenderer.invoke('accounts:getById', id),
    getDashboardStats: () => ipcRenderer.invoke('accounts:getStats'),

    // Notes
    createNote: (note: any) => ipcRenderer.invoke('notes:create', note),
    updateNote: (id: number, note: any) => ipcRenderer.invoke('notes:update', id, note),
    deleteNote: (id: number) => ipcRenderer.invoke('notes:delete', id),
    getNotesByAccountId: (id: number) => ipcRenderer.invoke('notes:getByAccountId', id),

    // Bans
    createBan: (ban: any) => ipcRenderer.invoke('bans:create', ban),
    updateBan: (id: number, ban: any) => ipcRenderer.invoke('bans:update', id, ban),
    updateBanStatus: (id: number, isActive: boolean) => ipcRenderer.invoke('bans:updateActiveStatus', id, isActive),
    deleteBan: (id: number) => ipcRenderer.invoke('bans:delete', id),
    getBansByAccountId: (id: number) => ipcRenderer.invoke('bans:getByAccountId', id),

    // Utilities
    exportCSV: () => ipcRenderer.invoke('system:exportCSV'),
    importCSV: () => ipcRenderer.invoke('system:importCSV'),
    backupDatabase: () => ipcRenderer.invoke('system:backupDatabase'),

    // Window Controls
    minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
    closeWindow: () => ipcRenderer.invoke('window:close'),
    isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),

    // App User / Lock
    hasAppUsers: () => ipcRenderer.invoke('appUser:hasUsers'),
    registerAppUser: (payload: { username: string; password: string }) => ipcRenderer.invoke('appUser:register', payload),
    verifyAppUser: (payload: { username: string; password: string }) => ipcRenderer.invoke('appUser:verify', payload),
});
