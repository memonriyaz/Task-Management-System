'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, LogOut, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: 'danger' | 'warning' | 'logout' | 'delete';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1E1E20] rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200/90 dark:border-gray-800 flex flex-col gap-5 animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">

          <div
            className={clsx(
              'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border',
              variant === 'danger'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : variant === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400',
            )}
          >
            {icon === 'logout' ? (
              <LogOut size={20} />
            ) : icon === 'delete' ? (
              <Trash2 size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <h3 className="text-[17px] font-bold text-gray-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 font-semibold text-[13px] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'px-5 py-2.5 rounded-xl text-white font-semibold text-[13px] shadow-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 active:scale-[0.98]'
                : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200',
            )}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
