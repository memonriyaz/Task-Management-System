'use client';

import React, { useState, useEffect } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { api } from '../../services/api';
import {
  X,
  Mail,
  Shield,
  Check,
  Copy,
  AlertCircle,
  Loader2,
  Briefcase,
  ExternalLink,
  UserPlus,
} from 'lucide-react';

export const InviteMemberModal: React.FC = () => {
  const {
    isInviteModalOpen,
    setInviteModalOpen,
    activeWorkspace,
    workspaces,
    refreshWorkspaces,
  } = useBoard();

  const [availableWorkspaces, setAvailableWorkspaces] = useState(workspaces);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN' | 'GUEST'>('MEMBER');
  const [copied, setCopied] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    inviteUrl: string;
    token: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      setAvailableWorkspaces(workspaces);
    } else if (isInviteModalOpen) {
      api.getWorkspaces().then((ws) => {
        if (ws && ws.length > 0) {
          setAvailableWorkspaces(ws);
        }
      }).catch(console.error);
    }
  }, [workspaces, isInviteModalOpen]);

  useEffect(() => {
    if (activeWorkspace) {
      setSelectedWorkspaceId(activeWorkspace.id);
    } else if (availableWorkspaces.length > 0) {
      setSelectedWorkspaceId(availableWorkspaces[0].id);
    }
  }, [activeWorkspace, availableWorkspaces]);

  const effectiveWorkspace =
    availableWorkspaces.find((w) => w.id === selectedWorkspaceId) ||
    workspaces.find((w) => w.id === selectedWorkspaceId) ||
    activeWorkspace ||
    workspaces[0] ||
    availableWorkspaces[0] ||
    null;

  if (!isInviteModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter an email address');
      return;
    }

    if (!effectiveWorkspace) {
      setErrorMessage('No active workspace found. Please create or select a workspace first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.createWorkspaceInvitation(effectiveWorkspace.id, {
        email: email.trim(),
        role,
      });

      setInviteResult({
        email: res.email,
        inviteUrl: res.inviteUrl || `http://localhost:3000/invite/${res.token}`,
        token: res.token,
      });
      setEmail('');
      refreshWorkspaces();
    } catch (err: any) {
      console.error('Invite error:', err);
      setErrorMessage(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteResult?.inviteUrl) {
      navigator.clipboard.writeText(inviteResult.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setInviteModalOpen(false);
    setInviteResult(null);
    setErrorMessage('');
    setEmail('');
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans select-none"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[460px] bg-white dark:bg-[#1E1E20] rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <UserPlus size={18} className="text-gray-500" />
              <span>Invite to {effectiveWorkspace?.name || 'Workspace'}</span>
            </h2>
            <p className="text-[12px] text-gray-400">
              New members can collaborate on boards and tasks in this workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-red-600 dark:text-red-400 text-[12px] animate-in fade-in">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {inviteResult ? (
          <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-green-50/70 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 animate-in fade-in">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-[13px] font-bold">
              <Check size={16} className="shrink-0" strokeWidth={3} />
              <span>Invitation generated for {inviteResult.email}!</span>
            </div>

            <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">
              Copy and share this invite link with them to join this workspace:
            </p>

            <div className="flex items-center gap-2 bg-white dark:bg-black/40 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
              <input
                type="text"
                readOnly
                value={inviteResult.inviteUrl}
                className="w-full bg-transparent text-[11px] font-mono text-gray-700 dark:text-gray-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 px-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors shrink-0 flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer"
              >
                {copied ? (
                  <Check size={13} className="text-green-600" />
                ) : (
                  <Copy size={13} />
                )}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={inviteResult.inviteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Open invite page</span>
                <ExternalLink size={11} />
              </a>

              <button
                type="button"
                onClick={() => setInviteResult(null)}
                className="text-[12px] text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium cursor-pointer"
              >
                + Invite another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {availableWorkspaces.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                  Target Workspace
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-[13px]">
                  <Briefcase size={15} className="text-gray-400" />
                  <select
                    value={effectiveWorkspace?.id || ''}
                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                    className="w-full bg-transparent text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {availableWorkspaces.map((w) => (
                      <option key={w.id} value={w.id} className="dark:bg-[#1E1E20]">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                Email Address *
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-[13px] focus-within:border-black dark:focus-within:border-white transition-all">
                <Mail size={15} className="text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="colleague@company.com"
                  className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                Role in Workspace
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-[13px]">
                <Shield size={15} className="text-gray-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-transparent text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="MEMBER" className="dark:bg-[#1E1E20]">
                    Member (Can view, create and be assigned to tasks)
                  </option>
                  <option value="ADMIN" className="dark:bg-[#1E1E20]">
                    Admin (Can invite members and manage workspace)
                  </option>
                  <option value="GUEST" className="dark:bg-[#1E1E20]">
                    Guest (Limited view access)
                  </option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[13px] font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                <span>{isSubmitting ? 'Sending...' : 'Send Invitation'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
