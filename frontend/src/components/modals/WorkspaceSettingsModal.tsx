'use client';

import React, { useState, useEffect } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceMembers, useWorkspaceInvitations } from '../../hooks/useWorkspace';
import { api } from '../../services/api';
import {
  X,
  Settings,
  Users,
  Mail,
  Shield,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
  Copy,
  Plus,
  RefreshCw,
  UserX,
  LogOut,
  UserMinus,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const WorkspaceSettingsModal: React.FC = () => {
  const {
    isWorkspaceSettingsModalOpen,
    setWorkspaceSettingsModalOpen,
    activeWorkspace,
    updateWorkspace,
    deleteWorkspace,
    leaveWorkspace,
    updateWorkspaceMemberRole,
    setInviteModalOpen,
  } = useBoard();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'invitations'>('general');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { data: members, isLoading: isLoadingMembers, refetch: refetchMembers } = useWorkspaceMembers(
    activeWorkspace?.id,
  );
  const { data: invitations, isLoading: isLoadingInvitations, refetch: refetchInvitations } =
    useWorkspaceInvitations(activeWorkspace?.id);

  const [roleUpdatingUserId, setRoleUpdatingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState('');
  const [confirmRemoveMemberData, setConfirmRemoveMemberData] = useState<{
    userId: string;
    userName: string;
    isSelf: boolean;
  } | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      setDescription(activeWorkspace.description || '');
      setGeneralError('');
      setGeneralSuccess(false);
      setIsConfirmDeleteOpen(false);
      setIsConfirmLeaveOpen(false);
      setDeleteConfirmText('');
      refetchMembers();
      refetchInvitations();
    }
  }, [activeWorkspace, isWorkspaceSettingsModalOpen, activeTab]);

  if (!isWorkspaceSettingsModalOpen || !activeWorkspace) return null;

  const isCurrentUserOwner = activeWorkspace.ownerId === user?.id;
  const activeMembers = members?.filter((m) => m.status === 'ACTIVE') || [];
  const isSoleMember = activeMembers.length <= 1;

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setGeneralError('Workspace name cannot be empty');
      return;
    }

    try {
      setIsSavingGeneral(true);
      setGeneralError('');
      await updateWorkspace(activeWorkspace.id, {
        name: name.trim(),
        description: description.trim(),
      });
      setGeneralSuccess(true);
      setTimeout(() => setGeneralSuccess(false), 2500);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to update workspace');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText !== activeWorkspace.name) return;

    try {
      setIsDeleting(true);
      await deleteWorkspace(activeWorkspace.id);
      setWorkspaceSettingsModalOpen(false);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to delete workspace');
      setIsDeleting(false);
    }
  };

  const handleLeaveWorkspace = async () => {
    try {
      setIsLeaving(true);
      setGeneralError('');
      await leaveWorkspace(activeWorkspace.id);
      setWorkspaceSettingsModalOpen(false);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to leave workspace');
      setIsLeaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setRoleUpdatingUserId(userId);
      setMemberActionError('');
      await updateWorkspaceMemberRole(activeWorkspace.id, userId, newRole);
      refetchMembers();
    } catch (err: any) {
      setMemberActionError(err.message || 'Failed to update member role');
    } finally {
      setRoleUpdatingUserId(null);
    }
  };

  const handleRemoveMember = (userId: string, isSelf: boolean = false, userName?: string) => {
    setConfirmRemoveMemberData({
      userId,
      userName: userName || 'this member',
      isSelf,
    });
  };

  const executeRemoveMember = async () => {
    if (!confirmRemoveMemberData) return;
    const { userId, isSelf } = confirmRemoveMemberData;

    try {
      setRemovingUserId(userId);
      setMemberActionError('');
      if (isSelf) {
        await leaveWorkspace(activeWorkspace.id);
        setWorkspaceSettingsModalOpen(false);
      } else {
        await api.removeWorkspaceMember(activeWorkspace.id, userId);
        refetchMembers();
      }
    } catch (err: any) {
      setMemberActionError(err.message || 'Failed to remove member');
    } finally {
      setRemovingUserId(null);
      setConfirmRemoveMemberData(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      await api.revokeWorkspaceInvitation(activeWorkspace.id, invitationId);
      refetchInvitations();
    } catch (err: any) {
      setMemberActionError(err.message || 'Failed to revoke invitation');
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const url = `http://localhost:3000/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans select-none"
      onClick={() => setWorkspaceSettingsModalOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1E1E20] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
              <Settings size={20} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">
                Workspace Settings
              </h2>
              <span className="text-[12px] text-gray-400">{activeWorkspace.name}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWorkspaceSettingsModalOpen(false)}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={clsx(
              'px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'general'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            <Settings size={15} />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={clsx(
              'px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'members'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            <Users size={15} />
            <span>Members ({members?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invitations')}
            className={clsx(
              'px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'invitations'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            <Mail size={15} />
            <span>Invitations ({invitations?.length || 0})</span>
          </button>
        </div>

        {activeTab === 'general' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {generalSuccess && (
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 flex items-center gap-2 text-green-700 dark:text-green-400 text-[13px]">
                <Check size={16} className="shrink-0" strokeWidth={3} />
                <span>Workspace details updated successfully!</span>
              </div>
            )}

            {generalError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-red-600 dark:text-red-400 text-[13px]">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGeneral} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Engineering Team"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                  Workspace Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the workspace purpose, team, or goals..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingGeneral}
                  className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingGeneral && <Loader2 size={14} className="animate-spin" />}
                  <span>{isSavingGeneral ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>

            <div className="mt-4 pt-6 border-t border-red-100 dark:border-red-950/40 flex flex-col gap-5">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-[14px]">
                <AlertTriangle size={16} />
                <span>Danger Zone</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <UserMinus size={15} className="text-amber-600 dark:text-amber-400" />
                    <span>Leave this Workspace</span>
                  </span>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400">
                    {isSoleMember
                      ? 'As the sole member in this workspace, to leave please delete the workspace from the danger zone below.'
                      : 'Remove yourself from this workspace. You will lose access to its boards and tasks until re-invited.'}
                  </p>
                </div>

                {!isConfirmLeaveOpen ? (
                  <button
                    type="button"
                    disabled={isSoleMember}
                    onClick={() => setIsConfirmLeaveOpen(true)}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-semibold text-[12px] transition-colors shrink-0 disabled:opacity-40 cursor-pointer"
                  >
                    Leave Workspace
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmLeaveOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[12px] font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isLeaving}
                      onClick={handleLeaveWorkspace}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-[12px] font-bold hover:bg-amber-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {isLeaving && <Loader2 size={13} className="animate-spin" />}
                      <span>Confirm Leave</span>
                    </button>
                  </div>
                )}
              </div>

              {isCurrentUserOwner && (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                      <Trash2 size={15} />
                      <span>Delete Workspace</span>
                    </span>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">
                      Permanently delete this workspace, including all its boards, columns, and task records.
                    </p>
                  </div>

                  {!isConfirmDeleteOpen ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      className="w-fit px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-[12px] hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Trash2 size={13} />
                      <span>Delete Workspace</span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-black/50 border border-red-300 dark:border-red-800 flex flex-col gap-2.5 animate-in fade-in">
                      <span className="text-[12px] font-semibold text-red-800 dark:text-red-300">
                        To confirm, please type &quot;{activeWorkspace.name}&quot; below:
                      </span>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={activeWorkspace.name}
                        className="w-full px-3 py-2 rounded-xl border border-red-300 dark:border-red-800 bg-transparent text-[13px] text-gray-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsConfirmDeleteOpen(false)}
                          className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[12px] font-medium hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteWorkspace}
                          disabled={deleteConfirmText !== activeWorkspace.name || isDeleting}
                          className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-[12px] font-bold hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isDeleting && <Loader2 size={13} className="animate-spin" />}
                          <span>Delete Workspace Forever</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {memberActionError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-red-600 dark:text-red-400 text-[12px]">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{memberActionError}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                Manage roles and permissions for everyone in this workspace.
              </span>
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Invite Member</span>
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden bg-white dark:bg-[#18181A]">
              {isLoadingMembers ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-gray-400 text-[13px]">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Loading members...</span>
                </div>
              ) : members && members.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {members.map((m) => {
                    const isOwner = m.role === 'OWNER';
                    const isSelf = m.user.id === user?.id;

                    return (
                      <div
                        key={m.id}
                        className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                      >

                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[12px]">
                            {m.user.avatar ? (
                              <img
                                src={m.user.avatar}
                                alt={m.user.name || 'Member'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{(m.user.name || 'U').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[13px] text-gray-900 dark:text-white truncate">
                                {m.user.name || m.user.username}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 truncate">
                              {m.user.email || 'No email provided'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isOwner ? (
                            <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                              Owner
                            </span>
                          ) : (
                            <div className="relative">
                              <select
                                value={m.role}
                                disabled={roleUpdatingUserId === m.user.id}
                                onChange={(e) => handleRoleChange(m.user.id, e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[12px] font-semibold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                              >
                                {isCurrentUserOwner && (
                                  <option value="OWNER">Owner (Transfer)</option>
                                )}
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                                <option value="GUEST">Guest</option>
                              </select>
                              {roleUpdatingUserId === m.user.id && (
                                <Loader2 size={12} className="animate-spin absolute right-2 top-2.5 text-gray-400" />
                              )}
                            </div>
                          )}

                          {isSelf ? (
                            !isSoleMember && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.user.id, true, m.user.name || m.user.email)}
                                disabled={removingUserId === m.user.id}
                                className="px-2.5 py-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 border border-amber-200 dark:border-amber-900/50"
                                title="Leave this workspace"
                              >
                                <LogOut size={13} />
                                <span>Leave</span>
                              </button>
                            )
                          ) : (
                            !isOwner && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.user.id, false, m.user.name || m.user.email)}
                                disabled={removingUserId === m.user.id}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                title="Remove from Workspace"
                              >
                                <UserX size={16} />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 text-[13px]">No members found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                Pending invitations to join this workspace.
              </span>
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>New Invite</span>
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden bg-white dark:bg-[#18181A]">
              {isLoadingInvitations ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-gray-400 text-[13px]">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Loading invitations...</span>
                </div>
              ) : invitations && invitations.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[13px] text-gray-900 dark:text-white truncate">
                          {inv.email}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Role: <span className="font-medium text-gray-600 dark:text-gray-300">{inv.role}</span> &bull; Status: <span className="text-amber-500">{inv.status}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyInviteLink(inv.token)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy Invite Link"
                        >
                          {copiedToken === inv.token ? (
                            <Check size={12} className="text-green-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span>{copiedToken === inv.token ? 'Copied' : 'Copy Link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Revoke Invitation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-[13px]">
                  No pending invitations for this workspace.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmRemoveMemberData}
        title={confirmRemoveMemberData?.isSelf ? `Leave ${activeWorkspace.name}?` : 'Remove Member?'}
        description={
          confirmRemoveMemberData?.isSelf
            ? isCurrentUserOwner
              ? `Are you sure you want to leave ${activeWorkspace.name}? Workspace ownership will automatically be transferred to the highest-ranking remaining administrator/member.`
              : `Are you sure you want to leave ${activeWorkspace.name}? You will lose access to all tasks and project documents.`
            : `Are you sure you want to remove ${confirmRemoveMemberData?.userName} from this workspace? They will be unassigned from their current tasks.`
        }
        confirmText={confirmRemoveMemberData?.isSelf ? 'Leave Workspace' : 'Remove Member'}
        cancelText="Cancel"
        variant="danger"
        icon={confirmRemoveMemberData?.isSelf ? 'logout' : 'danger'}
        onConfirm={executeRemoveMember}
        onClose={() => setConfirmRemoveMemberData(null)}
      />
    </div>
  );
};
