import { createContext, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

type Mode = 'init' | 'login' | 'unlocked';

export const AppLockContext = createContext<{ currentUser: { id: number; username: string } | null; lock: () => void }>({
    currentUser: null,
    lock: () => undefined,
});

export default function AppLock({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<Mode>('init');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function checkUsers() {
            try {
                const hasUsers = await window.api.hasAppUsers();
                if (!isMounted) return;
                setMode(hasUsers ? 'login' : 'init');
            } catch (err) {
                console.error('Failed to read lock state', err);
                if (isMounted) {
                    setMode('login');
                }
            }
        }

        checkUsers();
        return () => {
            isMounted = false;
        };
    }, []);

    const title = useMemo(() => {
        return mode === 'init' ? 'Create App Password' : 'Unlock Accounts';
    }, [mode]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Enter a username.');
            return;
        }
        if (password.length < 6) {
            setError('Use at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsBusy(true);
        try {
            const userId = await window.api.registerAppUser({ username: username.trim(), password });
            setCurrentUser({ id: userId, username: username.trim() });
            setMode('unlocked');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Failed to create user', err);
            setError('Failed to create user. Try a different username.');
        } finally {
            setIsBusy(false);
        }
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError('Enter your username and password.');
            return;
        }

        setIsBusy(true);
        try {
            const result = await window.api.verifyAppUser({ username: username.trim(), password });
            if (!result.success) {
                setError('Invalid credentials.');
                return;
            }
            if (result.user) {
                setCurrentUser(result.user);
            }
            setMode('unlocked');
            setPassword('');
        } catch (err) {
            console.error('Failed to verify user', err);
            setError('Unable to verify credentials.');
        } finally {
            setIsBusy(false);
        }
    }

    function handleLock() {
        setCurrentUser(null);
        setMode('login');
        setPassword('');
    }

    if (mode === 'unlocked') {
        return (
            <AppLockContext.Provider value={{ currentUser, lock: handleLock }}>
                {children}
            </AppLockContext.Provider>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="glass-panel w-full max-w-md rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-700/50">
                        <span className="material-symbols-outlined text-white text-[22px]">lock</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Protect your account list with a local password.</p>
                    </div>
                </div>

                <form onSubmit={mode === 'init' ? handleCreate : handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white"
                            placeholder="local-admin"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white"
                            placeholder="Enter password"
                        />
                    </div>
                    {mode === 'init' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Confirm Password</label>
                            <input
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                type="password"
                                className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white"
                                placeholder="Re-enter password"
                            />
                        </div>
                    )}
                    {error && (
                        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isBusy}
                        className={clsx(
                            'w-full bg-accent-green hover:bg-green-500 text-white dark:text-background-dark py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-all shadow-[0_0_20px_rgba(11,218,94,0.3)]',
                            isBusy && 'opacity-70 cursor-not-allowed'
                        )}
                    >
                        <span className="material-symbols-outlined text-[18px]">{mode === 'init' ? 'lock' : 'login'}</span>
                        {mode === 'init' ? 'Create Lock' : 'Unlock App'}
                    </button>
                </form>
            </div>
        </div>
    );
}
