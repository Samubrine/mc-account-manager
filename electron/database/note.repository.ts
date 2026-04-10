import { db } from './db';

export const noteRepository = {
    create: (note: { account_id: number; title: string; content: string }) => {
        const stmt = db.prepare(`
      INSERT INTO notes (account_id, title, content)
      VALUES (@account_id, @title, @content)
    `);
        const info = stmt.run(note);
        return info.lastInsertRowid;
    },

    update: (id: number, note: { title: string; content: string }) => {
        const stmt = db.prepare(`
      UPDATE notes SET title = @title, content = @content
      WHERE id = @id
    `);
        stmt.run({ ...note, id });
    },

    delete: (id: number) => {
        const stmt = db.prepare(`DELETE FROM notes WHERE id = ?`);
        stmt.run(id);
    },

    getByAccountId: (accountId: number) => {
        const stmt = db.prepare(`SELECT * FROM notes WHERE account_id = ? ORDER BY created_at DESC`);
        return stmt.all(accountId);
    }
};
