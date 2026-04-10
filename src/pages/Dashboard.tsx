import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

function StatCard({
    title,
    value,
    icon,
    iconColorClass,
    bgGradientColor,
}: {
    title: string;
    value: number;
    icon: string;
    iconColorClass: string;
    bgGradientColor: string;
}) {
    return (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className={clsx("absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-all duration-500", bgGradientColor)}></div>
            <div className="absolute right-4 top-4 opacity-10">
                <span className="material-symbols-outlined text-5xl text-slate-900 dark:text-white">{icon}</span>
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={clsx("p-2 rounded-lg", iconColorClass)}>
                        <span className="material-symbols-outlined">{icon}</span>
                    </div>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState({ total: 0, active: 0, banned: 0, newThisWeek: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await window.api.getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to load stats", err);
            }
        }
        fetchStats();
    }, []);

    return (
        <div className="space-y-6 morph-stagger-strong">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Dashboard Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your Minecraft accounts and monitor their status.</p>
                </div>
                <div className="flex gap-3">
                    <button className="glass-panel glass-panel-hover h-10 w-10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center rounded-lg">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                    </button>
                    <button
                        onClick={() => navigate('/accounts')}
                        className="bg-accent-green hover:bg-green-500 text-white dark:text-background-dark h-10 px-5 rounded-lg flex items-center gap-2 font-bold text-sm transition-all shadow-[0_0_20px_rgba(11,218,94,0.3)]">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Add Account</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 morph-stagger">
                <StatCard
                    title="Total Accounts"
                    value={stats.total}
                    icon="group"
                    iconColorClass="bg-primary/10 text-primary"
                    bgGradientColor="bg-primary/20 group-hover:bg-primary/30"
                />
                <StatCard
                    title="Active Accounts"
                    value={stats.active}
                    icon="check_circle"
                    iconColorClass="bg-accent-green/10 text-accent-green"
                    bgGradientColor="bg-accent-green/10 group-hover:bg-accent-green/20"
                />
                <StatCard
                    title="Banned Accounts"
                    value={stats.banned}
                    icon="block"
                    iconColorClass="bg-red-500/10 text-red-500"
                    bgGradientColor="bg-red-500/10 group-hover:bg-red-500/20"
                />
                <StatCard
                    title="New This Week"
                    value={stats.newThisWeek}
                    icon="auto_awesome"
                    iconColorClass="bg-purple-500/10 text-purple-500"
                    bgGradientColor="bg-purple-500/10 group-hover:bg-purple-500/20"
                />
            </div>

            <div className="mt-12 glass-panel rounded-2xl p-6 border-glass-border shadow-sm max-w-xl morph-stagger">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">System Utilities</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Safeguard your local data with manual backups.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">shield</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={async () => {
                            const res = await window.api.backupDatabase();
                            if (res.success) {
                                alert('Database backed up to: ' + res.path);
                            } else if (!res.cancelled) {
                                alert('Backup failed: ' + res.error);
                            }
                        }}
                        className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-[0_0_15px_rgba(19,91,236,0.3)]"
                    >
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        <span>Backup Database</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
