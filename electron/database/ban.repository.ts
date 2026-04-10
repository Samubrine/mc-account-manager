import { db } from './db';

export const banRepository = {
    expireDueBans: () => {
        const updated = db.prepare(`
            UPDATE bans
            SET is_active = 0
            WHERE is_active = 1
              AND unban_at IS NOT NULL
              AND datetime(unban_at) <= datetime('now')
        `).run();

        if (updated.changes > 0) {
            db.prepare(`
                UPDATE accounts
                SET status = 'Active'
                WHERE status = 'Banned'
                  AND id NOT IN (SELECT DISTINCT account_id FROM bans WHERE is_active = 1)
            `).run();
        }
    },
    create: (ban: { account_id: number; ban_reason: string; banned_at: string; unban_at?: string; is_active?: boolean }) => {
        const stmt = db.prepare(`
      INSERT INTO bans (account_id, ban_reason, banned_at, unban_at, is_active)
      VALUES (@account_id, @ban_reason, @banned_at, @unban_at, @is_active)
    `);
        const isActive = ban.is_active !== undefined ? (ban.is_active ? 1 : 0) : 1;
        const info = stmt.run({ ...ban, is_active: isActive });

        // If active, update account status to Banned
        if (isActive) {
            const updateAcc = db.prepare(`UPDATE accounts SET status = 'Banned' WHERE id = ?`);
            updateAcc.run(ban.account_id);
        }

        return info.lastInsertRowid;
    },

    update: (id: number, ban: { ban_reason: string; banned_at: string; unban_at?: string; is_active?: boolean }) => {
        const activeInt = ban.is_active ? 1 : 0;
        const stmt = db.prepare(`
            UPDATE bans
            SET ban_reason = @ban_reason,
                banned_at = @banned_at,
                unban_at = @unban_at,
                is_active = @is_active
            WHERE id = @id
        `);
        stmt.run({
            id,
            ban_reason: ban.ban_reason,
            banned_at: ban.banned_at,
            unban_at: ban.unban_at ?? null,
            is_active: activeInt
        });

        const banInfo = db.prepare(`SELECT account_id FROM bans WHERE id = ?`).get(id) as any;
        if (banInfo) {
            banRepository.syncAccountBanStatus(banInfo.account_id);
        }
    },

    updateActiveStatus: (id: number, isActive: boolean) => {
        const activeInt = isActive ? 1 : 0;
        const stmt = db.prepare(`UPDATE bans SET is_active = @is_active WHERE id = @id`);
        stmt.run({ id, is_active: activeInt });

        // Check if account has any other active bans to sync status
        const banInfo = db.prepare(`SELECT account_id FROM bans WHERE id = ?`).get(id) as any;
        if (banInfo) {
            banRepository.syncAccountBanStatus(banInfo.account_id);
        }
    },

    delete: (id: number) => {
        const banInfo = db.prepare(`SELECT account_id FROM bans WHERE id = ?`).get(id) as any;
        const stmt = db.prepare(`DELETE FROM bans WHERE id = ?`);
        stmt.run(id);

        if (banInfo) {
            banRepository.syncAccountBanStatus(banInfo.account_id);
        }
    },

    getByAccountId: (accountId: number) => {
        const stmt = db.prepare(`SELECT * FROM bans WHERE account_id = ? ORDER BY banned_at DESC`);
        return stmt.all(accountId);
    },

    syncAccountBanStatus: (accountId: number) => {
        const activeBans = db.prepare(`SELECT COUNT(*) as count FROM bans WHERE account_id = ? AND is_active = 1`).get(accountId) as any;

        if (activeBans.count > 0) {
            db.prepare(`UPDATE accounts SET status = 'Banned' WHERE id = ?`).run(accountId);
        } else {
            db.prepare(`UPDATE accounts SET status = 'Active' WHERE id = ?`).run(accountId);
        }
    }
};
