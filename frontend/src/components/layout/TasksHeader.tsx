'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { FilterMenu } from '../modals/FilterMenu';
import { api } from '../../services/api';
import {
  Sidebar,
  Search,
  SlidersHorizontal,
  Filter,
  Plus,
  List,
  LayoutGrid,
  Check,
  X,
  UserPlus,
  Bell,
  BellRing,
  CheckCheck,
  Inbox,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

export const TasksHeader: React.FC = () => {
  const {
    isSidebarOpen,
    toggleSidebar,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    visibleFields,
    toggleField,
    activeTab,
    filters,
    isFilterMenuOpen,
    setFilterMenuOpen,
    setCreateTaskModalOpen,
    setCreateProjectModalOpen,
    setInviteModalOpen,
    activeWorkspace,
    setWorkspaceSettingsModalOpen,
    openTaskDetail,
  } = useBoard();

  const [isFieldsOpen, setIsFieldsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const fieldsMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list || []);
    } catch (err) {

    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fieldsMenuRef.current && !fieldsMenuRef.current.contains(e.target as Node)) {
        setIsFieldsOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isFieldsOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFieldsOpen, isNotificationsOpen]);

  const handleMarkNotificationRead = async (id: string, link?: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      if (link && link.trim()) {
        if (link.startsWith('/invite/') || link.startsWith('http')) {
          window.location.href = link;
        } else {
          openTaskDetail(link);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fieldList: { key: keyof typeof visibleFields; label: string }[] = [
    { key: 'priority', label: 'Priority' },
    { key: 'members', label: 'Members' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'labels', label: 'Labels' },
    { key: 'status', label: 'Status' },
    { key: 'reporter', label: 'Reporter' },
  ];

  const totalActiveFilters =
    filters.status.length +
    filters.priority.length +
    filters.members.length +
    filters.labels.length +
    filters.team.length;

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#18181A] border-b border-gray-200/75 dark:border-gray-800 flex items-center justify-between z-20 shrink-0 select-none">

      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Expand Sidebar"
          >
            <Sidebar size={18} />
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWorkspaceSettingsModalOpen(true)}
            className="text-[13px] font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Workspace Settings"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate max-w-[150px]">{activeWorkspace?.name || 'Workspace'}</span>
          </button>
          <span className="text-gray-300 dark:text-gray-700 font-light">/</span>
          <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight capitalize">
            {activeTab}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">

        <div className="relative flex items-center">
          {isSearchOpen ? (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-1.5 w-64 sm:w-80 border border-gray-300/80 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Design Homepage"
                className="w-full bg-transparent text-[13px] text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400"
              />
              <span className="text-[10px] font-mono text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                ⌘F
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-colors border border-gray-200/80 dark:border-gray-800"
              title="Search (⌘F)"
            >
              <Search size={16} />
            </button>
          )}
        </div>

        <div className="relative" ref={fieldsMenuRef}>
          <button
            type="button"
            onClick={() => setIsFieldsOpen(!isFieldsOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-800 transition-colors"
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Fields</span>
          </button>

          {isFieldsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E1E20] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">

              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl mb-2">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'flex items-center justify-center gap-2 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-[#2A2A2D] text-black dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-black dark:hover:text-white',
                  )}
                >
                  <List size={15} />
                  <span>List</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  className={clsx(
                    'flex items-center justify-center gap-2 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150',
                    viewMode === 'board'
                      ? 'bg-white dark:bg-[#2A2A2D] text-black dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-black dark:hover:text-white',
                  )}
                >
                  <LayoutGrid size={15} />
                  <span>Board</span>
                </button>
              </div>

              <div className="flex flex-col gap-0.5 pt-1">
                {fieldList.map((field) => {
                  const isChecked = visibleFields[field.key];
                  return (
                    <button
                      key={String(field.key)}
                      type="button"
                      onClick={() => toggleField(field.key)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <span>{field.label}</span>
                      <div
                        className={clsx(
                          'w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors',
                          isChecked
                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                            : 'border-gray-300 dark:border-gray-600 bg-transparent',
                        )}
                      >
                        {isChecked && <Check size={12} className="stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterMenuOpen(!isFilterMenuOpen)}
            className={clsx(
              'p-2 rounded-xl transition-colors border flex items-center gap-1.5',
              totalActiveFilters > 0
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white border-gray-200/80 dark:border-gray-800',
            )}
            title="Filter Tasks"
          >
            <Filter size={16} />
            {totalActiveFilters > 0 && (
              <span className="text-[11px] font-bold">{totalActiveFilters}</span>
            )}
          </button>

          <FilterMenu
            isOpen={isFilterMenuOpen}
            onClose={() => setFilterMenuOpen(false)}
          />
        </div>

        <div className="relative" ref={notificationsMenuRef}>
          <button
            type="button"
            onClick={() => {
              if (!isNotificationsOpen) fetchNotifications();
              setIsNotificationsOpen(!isNotificationsOpen);
            }}
            className={clsx(
              'p-2 rounded-xl transition-colors border flex items-center justify-center relative cursor-pointer',
              unreadCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white border-gray-200/80 dark:border-gray-800',
            )}
            title="Notifications"
          >
            {unreadCount > 0 ? <BellRing size={16} /> : <Bell size={16} />}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#18181A]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#18181A] border border-gray-200/80 dark:border-gray-800 shadow-2xl z-50 p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[14px] text-gray-900 dark:text-white">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkNotificationRead(notif.id, notif.link)}
                      className={clsx(
                        'p-3 rounded-xl flex items-start gap-3 transition-colors cursor-pointer border',
                        notif.isRead
                          ? 'bg-gray-50/50 dark:bg-[#1E1E20]/40 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-[#202024]'
                          : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-gray-900 dark:text-white hover:bg-blue-100/50 dark:hover:bg-blue-950/50',
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        {notif.type === 'task_assigned' ? (
                          <UserCheck size={13} />
                        ) : notif.type === 'comment_reply' ? (
                          <MessageSquare size={13} />
                        ) : (
                          <Bell size={13} />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[12px] truncate">{notif.title}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400 flex flex-col items-center gap-1.5">
                    <Inbox size={24} className="text-gray-300 dark:text-gray-600" />
                    <span className="text-[12px]">No notifications yet</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-800 transition-colors"
          title="Invite Members to Workspace"
        >
          <UserPlus size={15} />
          <span className="hidden md:inline">Invite</span>
        </button>

        {activeTab === 'projects' ? (
          <button
            type="button"
            onClick={() => setCreateProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-150 shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Add Project</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCreateTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-150 shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </header>
  );
};
