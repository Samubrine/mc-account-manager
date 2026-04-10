export interface ElectronAPI {
    createAccount: (account: any) => Promise<number>;
    updateAccount: (id: number, account: any) => Promise<void>;
    deleteAccount: (id: number) => Promise<void>;
    getAccounts: (filters?: { search?: string; status?: string; sortBy?: string; order?: 'ASC' | 'DESC' }) => Promise<any[]>;
    getAccountById: (id: number) => Promise<any>;
    getDashboardStats: () => Promise<{ total: number; active: number; banned: number; newThisWeek: number }>;

    createNote: (note: { account_id: number; title: string; content: string }) => Promise<number>;
    updateNote: (id: number, note: { title: string; content: string }) => Promise<void>;
    deleteNote: (id: number) => Promise<void>;
    getNotesByAccountId: (id: number) => Promise<any[]>;

    createBan: (ban: { account_id: number; ban_reason: string; banned_at: string; unban_at?: string; is_active?: boolean }) => Promise<number>;
    updateBan: (id: number, ban: { ban_reason: string; banned_at: string; unban_at?: string; is_active?: boolean }) => Promise<void>;
    updateBanStatus: (id: number, isActive: boolean) => Promise<void>;
    deleteBan: (id: number) => Promise<void>;
    getBansByAccountId: (id: number) => Promise<any[]>;

    exportCSV: () => Promise<{ success: boolean; path?: string; error?: string; cancelled?: boolean }>;
    importCSV: () => Promise<{ success: boolean; count?: number; error?: string; cancelled?: boolean }>;
    backupDatabase: () => Promise<{ success: boolean; path?: string; error?: string; cancelled?: boolean }>;

    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    isWindowMaximized: () => Promise<boolean>;

    hasAppUsers: () => Promise<boolean>;
    registerAppUser: (payload: { username: string; password: string }) => Promise<number>;
    verifyAppUser: (payload: { username: string; password: string }) => Promise<{ success: boolean; user?: { id: number; username: string } }>;
}

declare global {
    interface Window {
        api: ElectronAPI;
    }
}
