import { db } from './db';
import crypto from 'crypto';
import { getEncryptionKey } from '../security/encryption';

const IV_LENGTH = 16;

function encrypt(text: string): string {
    const ENCRYPTION_KEY = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
    const ENCRYPTION_KEY = getEncryptionKey();
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export const accountRepository = {
    create: (account: any) => {
        if (!account.account_type) {
            account.account_type = 'NFA';
        }
        const stmt = db.prepare(`
      INSERT INTO accounts (email, password, username, account_type, status)
      VALUES (@email, @password, @username, @account_type, @status)
    `);

        const info = stmt.run({
            ...account,
            password: encrypt(account.password),
        });
        return info.lastInsertRowid;
    },

    update: (id: number, account: any) => {
        let query = `UPDATE accounts SET email = @email, username = @username, account_type = @account_type, status = @status, updated_at = CURRENT_TIMESTAMP`;

        // Only update password if provided
        if (account.password) {
            query += `, password = @password`;
            account.password = encrypt(account.password);
        }
        query += ` WHERE id = @id`;

        const stmt = db.prepare(query);
        stmt.run({ ...account, id });
    },

    delete: (id: number) => {
        const stmt = db.prepare(`DELETE FROM accounts WHERE id = ?`);
        stmt.run(id);
    },

    getAll: (filters?: { search?: string; status?: string; sortBy?: string; order?: 'ASC' | 'DESC' }) => {
        let query = `
            SELECT
                id,
                email,
                username,
                account_type,
                status,
                created_at,
                updated_at,
                (
                    SELECT MIN(unban_at)
                    FROM bans
                    WHERE bans.account_id = accounts.id
                      AND bans.is_active = 1
                      AND unban_at IS NOT NULL
                ) AS active_unban_at
            FROM accounts
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters?.search) {
            query += ` AND (email LIKE ? OR username LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters?.status) {
            query += ` AND status = ?`;
            params.push(filters.status);
        }

        const validSortCols = ['email', 'username', 'created_at', 'account_type', 'status'];
        if (filters?.sortBy && validSortCols.includes(filters.sortBy)) {
            query += ` ORDER BY ${filters.sortBy} ${filters.order === 'DESC' ? 'DESC' : 'ASC'}`;
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        const stmt = db.prepare(query);
        return stmt.all(...params);
    },

    getById: (id: number) => {
        const stmt = db.prepare(`
            SELECT
                *,
                (
                    SELECT MIN(unban_at)
                    FROM bans
                    WHERE bans.account_id = accounts.id
                      AND bans.is_active = 1
                      AND unban_at IS NOT NULL
                ) AS active_unban_at
            FROM accounts
            WHERE id = ?
        `);
        const account = stmt.get(id) as any;
        if (account && !account.account_type) {
            account.account_type = 'NFA';
        }
        if (account && account.password) {
            try {
                account.decryptedPassword = decrypt(account.password);
            } catch (e) {
                account.decryptedPassword = '[Decryption Failed]';
            }
        }
        return account;
    },

    getStats: () => {
        const total = db.prepare(`SELECT COUNT(*) as count FROM accounts`).get() as any;
        const active = db.prepare(`SELECT COUNT(*) as count FROM accounts WHERE status = 'Active'`).get() as any;
        const banned = db.prepare(`SELECT COUNT(*) as count FROM accounts WHERE status = 'Banned'`).get() as any;

        // SQLite uses strftime for date logic. Accounts created in the last 7 days.
        const recent = db.prepare(`
      SELECT COUNT(*) as count FROM accounts 
      WHERE created_at >= datetime('now', '-7 days')
    `).get() as any;

        return {
            total: total.count,
            active: active.count,
            banned: banned.count,
            newThisWeek: recent.count
        };
    }
};
