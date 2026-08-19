'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBoard } from '../../contexts/BoardContext';
import { api } from '../../services/api';
import { X, User, Mail, Briefcase, AtSign, Building2, LogOut, Check } from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const ProfileModal: React.FC = () => {
  const { user, logout } = useAuth();
  const { isProfileModalOpen, setProfileModalOpen, activeWorkspace } = useBoard();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [title, setTitle] = useState(user?.title || 'Product Designer & Engineer');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);

  if (!isProfileModalOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.updateProfile({ name, username, title });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveWorkspace = () => {
    setIsConfirmLeaveOpen(false);
    setProfileModalOpen(false);
    logout();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={() => setProfileModalOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1E1E20] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col gap-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
            Profile &amp; Workspace Settings
          </h2>
          <button
            type="button"
            onClick={() => setProfileModalOpen(false)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 shrink-0">
            <img
              src={
                user.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
              }
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[16px] text-gray-900 dark:text-white">
              {name || user.name || 'User'}
            </span>
            <span className="text-[12px] text-gray-400">@{username || user.username || 'user'}</span>
            <span className="text-[12px] text-blue-600 dark:text-blue-400 font-medium">
              {user.isGuest ? 'Guest Session' : user.email}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <User size={13} className="text-gray-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <AtSign size={13} className="text-gray-400" />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Briefcase size={13} className="text-gray-400" />
                <span>Role / Title</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {savedSuccess && (
              <span className="text-[12px] text-green-500 font-medium flex items-center gap-1">
                <Check size={14} /> Saved
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
            Workspace Access
          </span>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-[13px]">
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-gray-500" />
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {activeWorkspace?.name || (user.isGuest ? 'Personal Workspace' : `${user.name || 'My'}'s Workspace`)}
                </div>
                <div className="text-[11px] text-gray-400">Owner &amp; Admin</div>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-bold">
              Active
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsConfirmLeaveOpen(true)}
            className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={15} />
            <span>Leave Workspace</span>
          </button>
        </div>

        <ConfirmDialog
          isOpen={isConfirmLeaveOpen}
          title={`Leave ${activeWorkspace?.name || 'Workspace'}?`}
          description="You will lose access to all tasks, boards, and project channels in this workspace."
          confirmText="Confirm & Leave"
          cancelText="Cancel"
          variant="danger"
          icon="logout"
          onConfirm={handleLeaveWorkspace}
          onClose={() => setIsConfirmLeaveOpen(false)}
        />
      </div>
    </div>
  );
};
