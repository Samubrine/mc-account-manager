import { Link, useLocation } from 'react-router-dom';
import { useContext, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AppLockContext } from './AppLock';

export default function Sidebar() {
    const location = useLocation();
    const { currentUser, lock } = useContext(AppLockContext);
    const initials = useMemo(() => {
        const base = currentUser?.username?.trim() || 'User';
        const parts = base.split(' ').filter(Boolean);
        const letters = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : `${base[0]}`;
        return letters.toUpperCase();
    }, [currentUser]);

    // Theme logic
    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const navItems = [
        { label: 'Dashboard', icon: 'dashboard', path: '/' },
        { label: 'Accounts', icon: 'group', path: '/accounts' },
        { label: 'Banned Accounts', icon: 'warning', path: '/banned' },
    ];

    return (
        <aside className="w-72 h-full flex flex-col justify-between border-r border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-[#111318]/70 backdrop-blur-xl shadow-lg">
            {/* Header Section */}
            <div className="p-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-200"></div>
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg shadow-primary/30">
                            <span className="material-symbols-outlined text-white text-[22px]">token</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">MC Manager</h1>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">v2.4.0 • Online</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return isActive ? (
                            <Link key={item.path} to={item.path} className="group relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 transition-all duration-200">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>
                                <span className="material-symbols-outlined text-primary drop-shadow-[0_0_8px_rgba(19,91,236,0.5)]">{item.icon}</span>
                                <span className="font-medium text-primary">{item.label}</span>
                            </Link>
                        ) : (
                            <Link key={item.path} to={item.path} className="group relative flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                <span className="material-symbols-outlined group-hover:text-primary transition-colors duration-200">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer Section */}
            <div className="p-6 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl mb-6 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50">
                    <button
                        onClick={() => setIsDark(false)}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                            !isDark
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        )}
                    >
                        <span className="material-symbols-outlined text-[18px]">light_mode</span>
                        Light
                    </button>
                    <button
                        onClick={() => setIsDark(true)}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                            isDark
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        )}
                    >
                        <span className="material-symbols-outlined text-[18px]">dark_mode</span>
                        Dark
                    </button>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 group p-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {initials}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentUser?.username || 'Local User'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">App Lock Enabled</p>
                    </div>
                    <button
                        onClick={lock}
                        className="text-xs font-semibold text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white px-2 py-1 rounded-md border border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors"
                    >
                        Lock
                    </button>
                </div>
            </div>
        </aside>
    );
}
