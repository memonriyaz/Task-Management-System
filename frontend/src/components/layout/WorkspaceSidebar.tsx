'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutGrid,
  Box,
  ChevronDown,
  ChevronsUpDown,
  Sun,
  Moon,
  LogOut,
  SidebarClose,
  User,
  Plus,
  Users,
  Settings,
  Briefcase,
  Check,
  Building2,
  UserMinus,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const WorkspaceSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    toggleSidebar,
    selectedDetailTaskId,
    closeTaskDetail,
    selectProject,
    setProfileModalOpen,
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    selectWorkspace,
    setInviteModalOpen,
    setCreateWorkspaceModalOpen,
    setWorkspaceSettingsModalOpen,
    leaveWorkspace,
  } = useBoard();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);

  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isSidebarOpen) return null;

  const handleSelectTab = (tab: 'tasks' | 'projects') => {
    setActiveTab(tab);
    closeTaskDetail();
    selectProject(null);
  };

  const currentWorkspaceName = activeWorkspace?.name || 'My Workspace';

  return (
    <aside className="w-[245px] shrink-0 h-screen bg-[#F9F9FB] dark:bg-[#18181A] border-r border-gray-200/75 dark:border-gray-800 flex flex-col justify-between p-3 select-none transition-all duration-200 z-30 font-sans">

      <div className="flex flex-col gap-4">

        <div className="relative" ref={workspaceMenuRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-gray-200/60 dark:hover:bg-gray-800/80 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700/60 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">

              <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-[13px] shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                {currentWorkspaceName.charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col min-w-0 text-left">
                <span className="font-bold text-[13.5px] text-gray-900 dark:text-white truncate tracking-tight">
                  {currentWorkspaceName}
                </span>
                <span className="text-[11px] text-gray-400 font-medium truncate">
                  {activeWorkspace?.currentUserRole
                    ? `${activeWorkspace.currentUserRole.charAt(0)}${activeWorkspace.currentUserRole.slice(1).toLowerCase()}`
                    : 'Workspace'}
                </span>
              </div>
            </div>

            <ChevronsUpDown size={15} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 shrink-0 ml-1" />
          </button>

          {isWorkspaceMenuOpen && (
            <div className="absolute top-12 left-0 w-64 bg-white dark:bg-[#202022] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
              <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Workspaces ({workspaces.length})</span>
                <span className="text-[10px] text-blue-500 font-normal lowercase">switch anytime</span>
              </div>

              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto px-1.5 py-1">
                {workspaces && workspaces.length > 0 ? (
                  workspaces.map((ws) => {
                    const isActive = ws.id === activeWorkspaceId;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          setIsWorkspaceMenuOpen(false);
                          selectWorkspace(ws.id);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-black dark:bg-white text-white dark:text-black font-semibold shadow-xs'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isActive
                                ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {ws.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{ws.name}</span>
                        </div>
                        {isActive && <Check size={14} strokeWidth={3} className="shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-[12px] text-gray-400">No workspaces found</div>
                )}
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1.5" />

              <div className="flex flex-col gap-0.5 px-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setCreateWorkspaceModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus size={14} className="text-gray-500" />
                  <span>Create New Workspace</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setInviteModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Users size={14} className="text-gray-500" />
                  <span>Invite Members</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setWorkspaceSettingsModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings size={14} className="text-gray-500" />
                  <span>Workspace Settings</span>
                </button>

                {activeWorkspace && activeWorkspace.ownerId !== user?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      setIsConfirmLeaveOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <UserMinus size={14} className="text-amber-500" />
                    <span>Leave Workspace</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Navigation</span>
          </div>

          <button
            type="button"
            onClick={() => handleSelectTab('tasks')}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer',
              activeTab === 'tasks' && !selectedDetailTaskId
                ? 'bg-gray-200/80 dark:bg-gray-800 text-black dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-gray-800/40 hover:text-black dark:hover:text-white',
            )}
          >
            <LayoutGrid size={16} className="text-gray-500 dark:text-gray-400" />
            <span>Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('projects')}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer',
              activeTab === 'projects'
                ? 'bg-gray-200/80 dark:bg-gray-800 text-black dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-gray-800/40 hover:text-black dark:hover:text-white',
            )}
          >
            <Box size={16} className="text-gray-500 dark:text-gray-400" />
            <span>Projects</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceSettingsModalOpen(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-gray-800/40 hover:text-black dark:hover:text-white transition-all duration-150 cursor-pointer"
          >
            <Settings size={16} className="text-gray-500 dark:text-gray-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3 border-t border-gray-200/60 dark:border-gray-800/60">

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                  }
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="font-semibold text-[13px] text-gray-900 dark:text-white truncate">
                  {user?.name || user?.username || 'User'}
                </span>
                <span className="text-[10px] text-gray-400 truncate">
                  {user?.email || 'Logged in'}
                </span>
              </div>
            </div>
            <ChevronsUpDown size={14} className="text-gray-400 shrink-0" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute bottom-12 left-0 w-56 bg-white dark:bg-[#202022] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Account
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setProfileModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 cursor-pointer"
              >
                <User size={14} />
                <span>Profile Settings</span>
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full text-left px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>



        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Profile & Settings"
          >
            <User size={15} />
          </button>

          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <SidebarClose size={15} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmLeaveOpen}
        title={`Leave ${activeWorkspace?.name || 'Workspace'}?`}
        description="Are you sure you want to leave this workspace? You will lose access to its boards, tasks, and project documents until invited again."
        confirmText="Leave Workspace"
        cancelText="Stay"
        variant="danger"
        icon="logout"
        onConfirm={async () => {
          if (activeWorkspace) {
            await leaveWorkspace(activeWorkspace.id);
          }
          setIsConfirmLeaveOpen(false);
        }}
        onClose={() => setIsConfirmLeaveOpen(false)}
      />
    </aside>
  );
};
