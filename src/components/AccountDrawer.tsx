import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import Modal from './Modal';

interface Props {
    accountId: number | null;
    onClose: () => void;
    onUpdated: () => void;
}

export default function AccountDrawer({ accountId, onClose, onUpdated }: Props) {
    const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'bans'>('info');
    const [account, setAccount] = useState<any>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [bans, setBans] = useState<any[]>([]);
    const [nowTick, setNowTick] = useState(Date.now());
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [editForm, setEditForm] = useState({
        email: '',
        username: '',
        password: '',
        account_type: 'NFA',
        status: 'Active'
    });

    // Modals
    const [isAddNoteOpen, setAddNoteOpen] = useState(false);
    const [isAddBanOpen, setAddBanOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<any | null>(null);
    const [editingBan, setEditingBan] = useState<any | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'account' | 'note' | 'ban', id: number } | null>(null);

    useEffect(() => {
        if (accountId) {
            loadData();
            setShowPassword(false);
            setShowNewPassword(false);
        } else {
            setAccount(null);
            setActiveTab('info');
        }
    }, [accountId]);

    useEffect(() => {
        if (!(account?.status === 'Banned' && account.active_unban_at)) return;
        const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [account]);

    const loadData = async () => {
        if (!accountId) return;
        try {
            const acc = await window.api.getAccountById(accountId);
            setAccount(acc);
            setEditForm({
                email: acc?.email || '',
                username: acc?.username || '',
                password: '',
                account_type: acc?.account_type || 'NFA',
                status: acc?.status || 'Active'
            });
            const fetchedNotes = await window.api.getNotesByAccountId(accountId);
            setNotes(fetchedNotes);
            const fetchedBans = await window.api.getBansByAccountId(accountId);
            setBans(fetchedBans);
        } catch (e) {
            console.error("Failed loading account data", e);
        }
    };

    const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await window.api.createNote({
            account_id: accountId!,
            title: fd.get('title') as string,
            content: fd.get('content') as string
        });
        setAddNoteOpen(false);
        loadData();
    };

    const handleAddBan = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await window.api.createBan({
            account_id: accountId!,
            ban_reason: fd.get('reason') as string,
            banned_at: fd.get('banned_at') as string,
            unban_at: (fd.get('unban_at') as string) || undefined,
            is_active: true
        });
        setAddBanOpen(false);
        loadData();
        onUpdated(); // Refresh parent list
    };

    const handleEditNote = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingNote) return;
        const fd = new FormData(e.currentTarget);
        await window.api.updateNote(editingNote.id, {
            title: fd.get('title') as string,
            content: fd.get('content') as string,
        });
        setEditingNote(null);
        loadData();
    };

    const handleEditBan = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingBan) return;
        const fd = new FormData(e.currentTarget);
        await window.api.updateBan(editingBan.id, {
            ban_reason: fd.get('reason') as string,
            banned_at: fd.get('banned_at') as string,
            unban_at: (fd.get('unban_at') as string) || undefined,
            is_active: (fd.get('is_active') as string) === 'true'
        });
        setEditingBan(null);
        loadData();
        onUpdated();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        const { type, id } = deleteConfirm;

        if (type === 'account') {
            await window.api.deleteAccount(id);
            onUpdated();
            onClose();
        } else if (type === 'note') {
            await window.api.deleteNote(id);
            loadData();
        } else if (type === 'ban') {
            await window.api.deleteBan(id);
            loadData();
            onUpdated();
        }
        setDeleteConfirm(null);
    };

    const toggleBanActive = async (banId: number, currentActive: boolean) => {
        await window.api.updateBanStatus(banId, !currentActive);
        loadData();
        onUpdated();
    };

    const handleInfoUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await window.api.updateAccount(account.id, {
            email: editForm.email,
            username: editForm.username,
            password: editForm.password.trim() ? editForm.password : undefined,
            account_type: editForm.account_type,
            status: editForm.status
        });

        setIsEditingInfo(false);
        setInfoMessage('Account details updated');
        setTimeout(() => setInfoMessage(null), 2500);
        await loadData();
        onUpdated();
    };

    const cancelInfoEdit = () => {
        setIsEditingInfo(false);
        setEditForm({
            email: account.email || '',
            username: account.username || '',
            password: '',
            account_type: account.account_type || 'NFA',
            status: account.status || 'Active'
        });
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

    const getSkinUsername = () => {
        const candidate = (account?.username || account?.email?.split('@')?.[0] || 'Steve').trim();
        return candidate || 'Steve';
    };

    if (!accountId || !account) return null;

    return (
        <>
            <Modal
                isOpen={!!accountId}
                onClose={onClose}
                title={`Account: ${account.username || account.email}`}
                maxWidth="max-w-6xl"
                contentClassName="p-0 overflow-hidden"
            >

                <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] max-h-[80vh]">
                    <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-glass-border bg-gradient-to-b from-slate-100/60 to-slate-200/30 dark:from-slate-900/50 dark:to-slate-950/40 p-5">
                        <div className="h-full min-h-[240px] rounded-2xl border border-slate-200 dark:border-glass-border bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm p-4 flex flex-col items-center justify-center gap-4">
                            <img
                                src={`https://render.crafty.gg/3d/full/${encodeURIComponent(getSkinUsername())}`}
                                alt={`${getSkinUsername()} skin preview`}
                                className="w-full max-w-[220px] h-auto drop-shadow-[0_8px_24px_rgba(15,23,42,0.4)]"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                            />
                            <div className="text-center">
                                <p className="text-xs uppercase tracking-wider text-slate-500">Skin Preview</p>
                                <p className="font-semibold text-slate-900 dark:text-white mt-1">{getSkinUsername()}</p>
                            </div>
                        </div>
                    </aside>

                    <section className="p-6 overflow-y-auto morph-stagger-strong">

                {/* Tabs */}
                <div className="flex space-x-1 glass-panel p-1.5 rounded-xl mb-6 shadow-sm border-glass-border">
                    <button onClick={() => setActiveTab('info')} className={clsx("flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors", activeTab === 'info' ? 'bg-white dark:bg-slate-700/80 shadow text-primary dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5')}>
                        <span className="material-symbols-outlined text-[18px]">info</span> Info
                    </button>
                    <button onClick={() => setActiveTab('notes')} className={clsx("flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors", activeTab === 'notes' ? 'bg-white dark:bg-slate-700/80 shadow text-primary dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5')}>
                        <span className="material-symbols-outlined text-[18px]">description</span> Notes ({notes.length})
                    </button>
                    <button onClick={() => setActiveTab('bans')} className={clsx("flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors", activeTab === 'bans' ? 'bg-white dark:bg-slate-700/80 shadow text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5')}>
                        <span className="material-symbols-outlined text-[18px]">security</span> Bans ({bans.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div key={activeTab} className="tab-morph morph-stagger">
                {activeTab === 'info' && (
                    <div className="space-y-6">
                        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-5 border border-slate-200 dark:border-glass-border backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credentials</h3>
                                {!isEditingInfo ? (
                                    <button
                                        onClick={() => setIsEditingInfo(true)}
                                        className="text-sm font-medium text-primary hover:text-blue-500 transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Edit
                                    </button>
                                ) : null}
                            </div>

                            {!isEditingInfo ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Email</p>
                                        <p className="font-medium text-slate-900 dark:text-white select-all">{account.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Username</p>
                                        <p className="font-medium text-slate-900 dark:text-white select-all">{account.username || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Password (Decrypted)</p>
                                        <div className="mt-1 inline-flex items-center gap-2">
                                            <p className="font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded inline-block select-all">
                                                {showPassword ? (account.decryptedPassword || '********') : '••••••••'}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                                                title={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    {showPassword ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleInfoUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                                            className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Username</label>
                                        <input
                                            type="text"
                                            value={editForm.username}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                                            className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                placeholder="Leave empty to keep current password"
                                                value={editForm.password}
                                                onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                                                className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 pr-10 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword((prev) => !prev)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                                                title={showNewPassword ? 'Hide password' : 'Show password'}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    {showNewPassword ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Account Type</label>
                                            <select
                                                value={editForm.account_type}
                                                onChange={(e) => setEditForm((prev) => ({ ...prev, account_type: e.target.value }))}
                                                className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white"
                                            >
                                                <option value="XGP">XGP</option>
                                                <option value="MFA">MFA</option>
                                                <option value="SFA">SFA</option>
                                                <option value="NFA">NFA</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Status</label>
                                            <select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                                                className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green text-slate-900 dark:text-white"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Banned">Banned</option>
                                                <option value="Disabled">Disabled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={cancelInfoEdit}
                                            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-primary/20"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-5 border border-slate-200 dark:border-glass-border backdrop-blur-sm">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Meta Info</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Status</p>
                                    {(() => {
                                        const countdown = account.status === 'Banned'
                                            ? getUnbanCountdown(account.active_unban_at)
                                            : { text: '', expired: false };
                                        return (
                                            <>
                                                <p className="font-medium text-slate-900 dark:text-white">{account.status}</p>
                                                {account.status === 'Banned' && account.active_unban_at && !countdown.expired && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Unbanned in {countdown.text}
                                                    </p>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Account Type</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{account.account_type || 'NFA'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Created At</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{new Date(account.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {infoMessage ? (
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                                {infoMessage}
                            </div>
                        ) : null}

                        <div className="pt-4 border-t border-slate-200 dark:border-glass-border">
                            <button onClick={() => setDeleteConfirm({ type: 'account', id: account.id })} className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2.5 rounded-lg font-medium transition-colors w-full justify-center border border-transparent hover:border-red-500/20">
                                <span className="material-symbols-outlined text-[18px]">delete</span> Delete Entire Account
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <button onClick={() => setAddNoteOpen(true)} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-glass-border rounded-xl text-slate-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 font-medium transition-colors">
                            + Add New Note
                        </button>

                        {notes.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">No notes attached to this account.</p>
                        ) : (
                            notes.map(note => (
                                <div key={note.id} className="bg-white/70 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-glass-border shadow-sm relative group backdrop-blur-sm">
                                    <h4 className="font-bold text-slate-900 dark:text-white flex justify-between pr-8">
                                        {note.title}
                                    </h4>
                                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingNote(note)} className="text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button onClick={() => setDeleteConfirm({ type: 'note', id: note.id })} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">{note.content}</p>
                                    <p className="text-xs text-slate-400 mt-3">{new Date(note.created_at).toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'bans' && (
                    <div className="space-y-4">
                        <button onClick={() => setAddBanOpen(true)} className="w-full py-4 border-2 border-dashed border-red-200 dark:border-red-900/50 rounded-xl text-red-500 hover:text-red-600 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors mb-4 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">gavel</span> Record Ban Instance
                        </button>

                        {bans.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">No ban history for this account. Good standing!</p>
                        ) : (
                            bans.map(ban => (
                                <div key={ban.id} className={clsx("p-5 rounded-xl border shadow-sm relative backdrop-blur-sm", ban.is_active ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20' : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-glass-border')}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            Reason: {ban.ban_reason}
                                            {ban.is_active ? <span className="text-[10px] bg-red-600/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold border border-red-600/20">Active</span> : <span className="text-[10px] bg-slate-500/20 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold border border-slate-500/20">Expired</span>}
                                        </h4>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setEditingBan(ban)} className="text-slate-400 hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button onClick={() => setDeleteConfirm({ type: 'ban', id: ban.id })} className="text-slate-400 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                                        <div>
                                            <span className="text-slate-500">Banned At:</span>
                                            <p className="font-medium text-slate-800 dark:text-slate-300">{new Date(ban.banned_at).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Unban At:</span>
                                            <p className="font-medium text-slate-800 dark:text-slate-300">{ban.unban_at ? new Date(ban.unban_at).toLocaleString() : 'Permanent'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-slate-200 dark:border-glass-border flex justify-end">
                                        <button
                                            onClick={() => toggleBanActive(ban.id, ban.is_active)}
                                            className={clsx("text-xs font-bold px-4 py-2 rounded-lg transition-colors border", ban.is_active ? "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-glass-border dark:text-slate-300 dark:hover:bg-white/5" : "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10")}
                                        >
                                            {ban.is_active ? 'Mark as Expired' : 'Reactivate Ban'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                </div>
                    </section>
                </div>
            </Modal>

            {/* Adding Modals */}
            <Modal isOpen={isAddNoteOpen} onClose={() => setAddNoteOpen(false)} title="Add Note">
                <form onSubmit={handleAddNote} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Title</label>
                        <input required type="text" name="title" className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Content</label>
                        <textarea required name="content" rows={4} className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-white"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setAddNoteOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-primary/20">Save Note</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAddBanOpen} onClose={() => setAddBanOpen(false)} title="Record Ban">
                <form onSubmit={handleAddBan} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Ban Reason</label>
                        <input required type="text" name="reason" placeholder="e.g. Exploiting, Toxicity" className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Banned At <span className="text-red-500">*</span></label>
                            <input required type="datetime-local" name="banned_at" defaultValue={new Date().toISOString().slice(0, 16)} className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Unban At <span className="text-xs font-normal opacity-70">(Leave empty if perm)</span></label>
                            <input type="datetime-local" name="unban_at" className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-white" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setAddBanOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20">Apply Ban</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!editingNote} onClose={() => setEditingNote(null)} title="Edit Note">
                {editingNote ? (
                    <form onSubmit={handleEditNote} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Title</label>
                            <input
                                required
                                type="text"
                                name="title"
                                defaultValue={editingNote.title}
                                className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Content</label>
                            <textarea
                                required
                                name="content"
                                rows={5}
                                defaultValue={editingNote.content}
                                className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-white"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setEditingNote(null)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-primary/20">Save Note</button>
                        </div>
                    </form>
                ) : null}
            </Modal>

            <Modal isOpen={!!editingBan} onClose={() => setEditingBan(null)} title="Edit Ban">
                {editingBan ? (
                    <form onSubmit={handleEditBan} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Ban Reason</label>
                            <input
                                required
                                type="text"
                                name="reason"
                                defaultValue={editingBan.ban_reason}
                                className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Banned At</label>
                                <input
                                    required
                                    type="datetime-local"
                                    name="banned_at"
                                    defaultValue={new Date(editingBan.banned_at).toISOString().slice(0, 16)}
                                    className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Unban At</label>
                                <input
                                    type="datetime-local"
                                    name="unban_at"
                                    defaultValue={editingBan.unban_at ? new Date(editingBan.unban_at).toISOString().slice(0, 16) : ''}
                                    className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Ban State</label>
                            <select
                                name="is_active"
                                defaultValue={editingBan.is_active ? 'true' : 'false'}
                                className="w-full border border-slate-300 dark:border-glass-border bg-white dark:bg-background-dark/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-white"
                            >
                                <option value="true">Active</option>
                                <option value="false">Expired</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setEditingBan(null)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20">Save Ban</button>
                        </div>
                    </form>
                ) : null}
            </Modal>

            {/* Delete confirmation */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Deletion">
                <div className="space-y-4 text-slate-700 dark:text-slate-300">
                    <p>Are you sure you want to delete this {deleteConfirm?.type}? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20">Yes, Delete</button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
