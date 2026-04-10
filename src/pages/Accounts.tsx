import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import Modal from '../components/Modal';
import AccountDrawer from '../components/AccountDrawer';

export default function Accounts() {
    const location = useLocation();

    const [accounts, setAccounts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(location.pathname === '/banned' ? 'Banned' : '');
    const [sortBy, setSortBy] = useState('created_at');
    const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [nowTick, setNowTick] = useState(Date.now());

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

    const fetchAccounts = useCallback(async () => {
        try {
            const data = await window.api.getAccounts({
                search,
                status: statusFilter,
                sortBy,
                order
            });
            setAccounts(data);
        } catch (err) {
            console.error(err);
            showToast('Failed to load accounts');
        }
    }, [search, statusFilter, sortBy, order]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    useEffect(() => {
        const hasCountdown = accounts.some((account) => account.status === 'Banned' && account.active_unban_at);
        if (!hasCountdown) return;

        const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [accounts]);

    useEffect(() => {
        if (location.pathname === '/banned') {
            setStatusFilter('Banned');
        } else {
            setStatusFilter('');
        }
    }, [location.pathname]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                setAddModalOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleSort = (col: string) => {
        if (sortBy === col) {
            setOrder(order === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(col);
            setOrder('ASC');
        }
    };

    const getUnbanCountdown = (unbanAtRaw?: string) => {
        if (!unbanAtRaw) return { text: '', expired: false };
        const unbanAt = new Date(unbanAtRaw);
        if (Number.isNaN(unbanAt.getTime())) return { text: '', expired: false };
        const diffMs = unbanAt.getTime() - nowTick;
        if (diffMs <= 0) return { text: '0m', expired: true };

        const totalMinutes = Math.floor(diffMs / 60000);
        const totalHours = Math.floor(diffMs / 3600000);
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        const minutes = totalMinutes % 60;

        if (days >= 1) {
            return { text: `${days}d ${hours}h`, expired: false };
        }
        return { text: `${hours}h ${minutes}m`, expired: false };
    };

    const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const password = fd.get('password') as string;

        await window.api.createAccount({
            email: fd.get('email') as string,
            password,
            username: fd.get('username') as string,
            account_type: fd.get('account_type') as string,
            status: fd.get('status') as string || 'Active'
        });

        setAddModalOpen(false);
        fetchAccounts();
        showToast('Account created successfully');
    };

    const handleExport = async () => {
        const res = await window.api.exportCSV();
        if (res.success) showToast('Exported to ' + res.path);
        else if (!res.cancelled) showToast('Export failed: ' + res.error);
    };

    const handleImport = async () => {
        const res = await window.api.importCSV();
        if (res.success) {
            showToast(`Imported ${res.count} accounts.`);
            fetchAccounts();
        }
        else if (!res.cancelled) showToast('Import failed: ' + res.error);
    };

    return (
        <div className="space-y-6 morph-stagger-strong">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Accounts</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all Minecraft accounts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleImport} className="glass-panel glass-panel-hover flex items-center gap-2 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-lg font-medium transition-colors">
                        <span className="material-symbols-outlined text-[18px]">upload</span> Import CSV
                    </button>
                    <button onClick={handleExport} className="glass-panel glass-panel-hover flex items-center gap-2 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-lg font-medium transition-colors">
                        <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
                    </button>
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="flex items-center gap-2 bg-accent-green hover:bg-green-500 text-white dark:text-background-dark px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow-[0_0_20px_rgba(11,218,94,0.3)] ml-2"
                        title="Ctrl+N"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span> New Account
                    </button>
                </div>
            </header>

            {/* Accounts Table */}
            <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-200 dark:border-glass-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Accounts List</h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors text-[20px]">search</span>
                            <input
                                type="text"
                                placeholder="Search email or username..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/60 dark:bg-background-dark/50 border border-slate-200 dark:border-glass-border rounded-lg focus:ring-1 focus:ring-accent-green focus:border-accent-green outline-none text-slate-900 dark:text-white transition-all w-72"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-500 text-[20px]">filter_list</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white/60 dark:bg-background-dark/50 border border-slate-200 dark:border-glass-border rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-accent-green text-slate-900 dark:text-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Banned">Banned</option>
                                <option value="Disabled">Disabled</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100/50 dark:bg-black/20 border-b border-slate-200 dark:border-glass-border">
                            <tr>
                                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors" onClick={() => toggleSort('email')}>
                                    <div className="flex items-center gap-2">
                                        Email
                                        {sortBy === 'email' && (
                                            <span className="material-symbols-outlined text-[16px]">
                                                {order === 'ASC' ? 'expand_less' : 'expand_more'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors" onClick={() => toggleSort('username')}>
                                    <div className="flex items-center gap-2">
                                        Username
                                        {sortBy === 'username' && (
                                            <span className="material-symbols-outlined text-[16px]">
                                                {order === 'ASC' ? 'expand_less' : 'expand_more'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors" onClick={() => toggleSort('status')}>
                                    <div className="flex items-center gap-2">
                                        Status
                                        {sortBy === 'status' && (
                                            <span className="material-symbols-outlined text-[16px]">
                                                {order === 'ASC' ? 'expand_less' : 'expand_more'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors" onClick={() => toggleSort('account_type')}>
                                    <div className="flex items-center gap-2">
                                        Type
                                        {sortBy === 'account_type' && (
                                            <span className="material-symbols-outlined text-[16px]">
                                                {order === 'ASC' ? 'expand_less' : 'expand_more'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors" onClick={() => toggleSort('created_at')}>
                                    <div className="flex items-center gap-2">
                                        Created
                                        {sortBy === 'created_at' && (
                                            <span className="material-symbols-outlined text-[16px]">
                                                {order === 'ASC' ? 'expand_less' : 'expand_more'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-glass-border morph-stagger-rows">
                            {accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No accounts found matching your criteria.
                                    </td>
                                </tr>
                            ) : accounts.map((account) => (
                                <tr
                                    key={account.id}
                                    onClick={() => setSelectedAccountId(account.id)}
                                    className="hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={`https://render.crafty.gg/2d/head/${encodeURIComponent((account.username || account.email?.split('@')?.[0] || 'Steve').trim() || 'Steve')}`}
                                                alt={`${account.username || account.email} avatar`}
                                                className="w-7 h-7 rounded-md border border-slate-200 dark:border-glass-border bg-slate-100 dark:bg-slate-900 object-cover"
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                            />
                                            <span>{account.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{account.username || '-'}</td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const countdown = account.status === 'Banned'
                                                ? getUnbanCountdown(account.active_unban_at)
                                                : { text: '', expired: false };
                                            return (
                                                <>
                                                    <span className={clsx(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                        account.status === 'Active'
                                                            ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
                                                            : account.status === 'Banned'
                                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                                : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                    )}>
                                                        {account.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span>}
                                                        {account.status === 'Banned' && <span className="material-symbols-outlined text-[12px]">block</span>}
                                                        {account.status}
                                                    </span>
                                                    {account.status === 'Banned' && account.active_unban_at && !countdown.expired && (
                                                        <div className="mt-1 text-[11px] text-slate-400">
                                                            Unbanned in {countdown.text}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/50">
                                            {account.account_type || 'NFA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{new Date(account.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-glass-border flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Showing {accounts.length} account{accounts.length === 1 ? '' : 's'}</span>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">tune</span>
                        <span>Sort by clicking column headers</span>
                    </div>
                </div>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Account">
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email Address <span className="text-red-500">*</span></label>
                        <input required type="email" name="email" className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Password <span className="text-red-500">*</span></label>
                        <input required type="password" name="password" className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Username</label>
                        <input type="text" name="username" className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Account Type</label>
                        <select name="account_type" className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white">
                            <option value="XGP">XGP</option>
                            <option value="MFA">MFA</option>
                            <option value="SFA">SFA</option>
                            <option value="NFA">NFA</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Initial Status</label>
                        <select name="status" className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white">
                            <option value="Active">Active</option>
                            <option value="Banned">Banned</option>
                            <option value="Disabled">Disabled</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-accent-green hover:bg-green-500 text-white dark:text-background-dark font-medium rounded-lg transition-colors shadow-lg shadow-accent-green/20">Create Account</button>
                    </div>
                </form>
            </Modal>

            <AccountDrawer
                accountId={selectedAccountId}
                onClose={() => { setSelectedAccountId(null); fetchAccounts(); }}
                onUpdated={fetchAccounts}
            />

            {toastMessage && (
                <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white px-6 py-3 rounded-xl shadow-2xl z-50">
                    <p className="font-medium text-sm">{toastMessage}</p>
                </div>
            )}
        </div>
    );
}
