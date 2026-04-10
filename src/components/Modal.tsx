import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
    contentClassName?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-md',
    contentClassName = 'p-6 overflow-y-auto'
}: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className={`glass-panel modal-pop rounded-2xl shadow-2xl shadow-black/50 z-10 w-full ${maxWidth} overflow-hidden flex flex-col scale-100 transition-transform bg-white/80 dark:bg-[#111318]/95 border border-slate-200 dark:border-glass-border`}>
                <div className="px-6 py-4 border-b border-slate-200 dark:border-glass-border flex items-center justify-between text-slate-900 dark:text-white bg-slate-100/50 dark:bg-black/20">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-white/5 transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div className={contentClassName}>
                    {children}
                </div>
            </div>
        </div>
    );
}
