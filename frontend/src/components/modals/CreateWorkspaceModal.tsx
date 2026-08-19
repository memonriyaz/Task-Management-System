'use client';

import React, { useState } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { X, Briefcase, AlignLeft, Loader2, AlertCircle } from 'lucide-react';

export const CreateWorkspaceModal: React.FC = () => {
  const { isCreateWorkspaceModalOpen, setCreateWorkspaceModalOpen, createWorkspace } = useBoard();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isCreateWorkspaceModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await createWorkspace({
        name: name.trim(),
        description: description.trim(),
      });
      setName('');
      setDescription('');
      setCreateWorkspaceModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      onClick={() => setCreateWorkspaceModalOpen(false)}
    >
      <div
        className="w-full max-w-[420px] bg-white dark:bg-[#1E1E20] rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">
              Create New Workspace
            </h2>
            <p className="text-[12px] text-gray-400">
              Workspaces organize your team, projects, and boards.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateWorkspaceModalOpen(false)}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-red-600 dark:text-red-400 text-[12px]">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
              Workspace Name
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-[13px] focus-within:border-black dark:focus-within:border-white transition-all">
              <Briefcase size={15} className="text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marketing Team, Product Core"
                className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-[13px] focus-within:border-black dark:focus-within:border-white transition-all">
              <AlignLeft size={15} className="text-gray-400 mt-0.5" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                rows={2}
                className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setCreateWorkspaceModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[13px] font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>{isSubmitting ? 'Creating...' : 'Create Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
