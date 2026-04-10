import { db } from './db';
import { hashPassword, verifyPassword } from '../security/password';

export const userRepository = {
    hasUsers() {
        const row = db.prepare('SELECT COUNT(*) as count FROM app_users').get() as { count: number };
        return row.count > 0;
    },

    create(username: string, password: string) {
        const passwordHash = hashPassword(password);
        const stmt = db.prepare(`
            INSERT INTO app_users (username, password_hash)
            VALUES (@username, @password_hash)
        `);
        const result = stmt.run({ username, password_hash: passwordHash });
        return result.lastInsertRowid as number;
    },

    verify(username: string, password: string) {
        const user = db
            .prepare('SELECT id, username, password_hash FROM app_users WHERE username = ?')
            .get(username) as { id: number; username: string; password_hash: string } | undefined;

        if (!user) {
            return { success: false } as const;
        }

        const valid = verifyPassword(password, user.password_hash);
        if (!valid) {
            return { success: false } as const;
        }

        return { success: true, user: { id: user.id, username: user.username } } as const;
    },
};
