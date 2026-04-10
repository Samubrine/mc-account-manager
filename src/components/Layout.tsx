import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isMaximized, setIsMaximized] = useState(false);
    const location = useLocation();
    const routeMorphClass =
        location.pathname === '/'
            ? 'route-dashboard'
            : location.pathname === '/banned'
                ? 'route-banned'
                : 'route-accounts';

    useEffect(() => {
        let isMounted = true;
        async function syncWindowState() {
            try {
                const maximized = await window.api.isWindowMaximized();
                if (isMounted) {
                    setIsMaximized(maximized);
                }
            } catch (err) {
                console.error('Failed to read window state', err);
            }
        }

        syncWindowState();
        return () => {
            isMounted = false;
        };
    }, []);

    async function handleMaximizeToggle() {
        await window.api.maximizeWindow();
        const maximized = await window.api.isWindowMaximized();
        setIsMaximized(maximized);
    }

    return (
        <div className="relative w-full min-h-screen">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/10 blur-[110px] rounded-full"></div>
                <div className="absolute bottom-[20%] left-[20%] w-[25%] h-[25%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
            </div>

            {/* Main Layout */}
            <div className="relative z-10 flex w-full h-screen flex-col">
                <header className="app-drag h-12 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-[#111318]/70 backdrop-blur-xl px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-700/50">
                            <span className="material-symbols-outlined text-white text-[18px]">token</span>
                        </div>
                        <div className="leading-tight">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">MC Account Database Manager</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Secure local account workspace</p>
                        </div>
                    </div>
                    <div className="app-no-drag flex items-center gap-2">
                        <button
                            onClick={() => window.api.minimizeWindow()}
                            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                            aria-label="Minimize window"
                        >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <button
                            onClick={handleMaximizeToggle}
                            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                            aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
                        >
                            <span className="material-symbols-outlined text-[18px]">{isMaximized ? 'filter_none' : 'crop_square'}</span>
                        </button>
                        <button
                            onClick={() => window.api.closeWindow()}
                            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-red-500/90 dark:text-slate-400 dark:hover:text-white transition-colors"
                            aria-label="Close window"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                </header>
                <div className="flex flex-1 min-h-0">
                    <Sidebar />
                    <main className="flex-1 p-8 overflow-auto relative">
                        <div key={`route-bg-${location.pathname}`} className={`route-blob-layer ${routeMorphClass}`}>
                            <div className="route-blob route-blob-a" />
                            <div className="route-blob route-blob-b" />
                            <div className="route-blob route-blob-c" />
                        </div>
                        <div key={location.pathname} className="w-full h-full page-morph">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
