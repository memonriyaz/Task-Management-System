'use client';

import React, { useState } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceMembers } from '../../hooks/useWorkspace';
import { Task } from '../../types';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Signal,
  CheckCircle2,
  Trash2,
  Tag,
  User,
  Calendar,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const ListView: React.FC = () => {
  const {
    activeBoard,
    isLoading,
    searchQuery,
    visibleFields,
    filters,
    openTaskDetail,
    updateTask,
    deleteTask,
    setCreateTaskModalOpen,
    setCreateTaskDefaultColumnId,
  } = useBoard();
  const { user } = useAuth();
  const { data: workspaceMembers } = useWorkspaceMembers(activeBoard?.workspaceId);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);
  const [activeMemberPickerTaskId, setActiveMemberPickerTaskId] = useState<string | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null);
  const [activePriorityPickerTaskId, setActivePriorityPickerTaskId] = useState<string | null>(null);

  const teamMembers = React.useMemo(() => {
    const list: { id: string; name: string; avatar?: string }[] = [];
    const seen = new Set<string>();

    if (workspaceMembers) {
      for (const m of workspaceMembers) {
        if (m.user && !seen.has(m.user.id)) {
          seen.add(m.user.id);
          list.push({
            id: m.user.id,
            name: m.user.name || m.user.username || 'Member',
            avatar: m.user.avatar || '',
          });
        }
      }
    }

    if (user && !seen.has(user.id)) {
      list.unshift({
        id: user.id,
        name: user.name || user.username || 'You',
        avatar: user.avatar || '',
      });
    }

    return list;
  }, [workspaceMembers, user]);

  const priorityOptions = ['No Priority', 'Urgent', 'High', 'Medium', 'Low'];

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-48" />
        <div className="h-44 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
        <div className="h-44 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
      </div>
    );
  }

  if (!activeBoard || !activeBoard.columns || activeBoard.columns.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <h3 className="text-[17px] font-bold text-gray-900 dark:text-white mb-1">
          No Columns Found
        </h3>
        <p className="text-[13px] text-gray-500 max-w-sm mb-5">
          This workspace board does not have any active columns yet.
        </p>
      </div>
    );
  }

  const toggleGroup = (colId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  const handleSetMember = async (taskId: string, member: { name: string; avatar: string }) => {
    await updateTask(taskId, { assigneeName: member.name, assigneeAvatar: member.avatar });
    setActiveMemberPickerTaskId(null);
  };

  const handleSetPriority = async (taskId: string, priority: string) => {
    await updateTask(taskId, { priority });
    setActivePriorityPickerTaskId(null);
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto overflow-x-auto p-4 sm:p-8 bg-white dark:bg-[#121214] select-none flex flex-col gap-8">
      {activeBoard.columns.map((column) => {
        if (filters.status.length > 0 && !filters.status.includes(column.name)) {
          return null;
        }

        const isCollapsed = !!collapsedGroups[column.id];

        const filteredTasks = column.tasks.filter((t) => {
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchSearch =
              t.title.toLowerCase().includes(q) ||
              (t.description && t.description.toLowerCase().includes(q)) ||
              (t.labels && t.labels.toLowerCase().includes(q));
            if (!matchSearch) return false;
          }

          if (filters.priority.length > 0 && !filters.priority.includes(t.priority)) {
            return false;
          }

          if (
            filters.members.length > 0 &&
            (!t.assigneeName || !filters.members.includes(t.assigneeName))
          ) {
            return false;
          }

          if (filters.labels.length > 0) {
            const taskLabels = t.labels
              ? t.labels.split(',').map((l) => l.trim())
              : [];
            const hasLabel = filters.labels.some((l) => taskLabels.includes(l));
            if (!hasLabel) return false;
          }

          if (filters.team.length > 0 && (!t.team || !filters.team.includes(t.team))) {
            return false;
          }

          return true;
        });

        return (
          <div key={column.id} className="flex flex-col gap-3">

            <button
              type="button"
              onClick={() => toggleGroup(column.id)}
              className="flex items-center gap-2 text-left group w-fit"
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-gray-500 group-hover:text-black dark:group-hover:text-white" />
              ) : (
                <ChevronDown size={16} className="text-gray-500 group-hover:text-black dark:group-hover:text-white" />
              )}
              <h2 className="font-bold text-[15px] text-gray-900 dark:text-white">
                {column.name} ({filteredTasks.length})
              </h2>
            </button>

            {!isCollapsed && (
              <div className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-visible bg-white dark:bg-[#18181A]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200/75 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#1E1E20]/50 text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                      <th className="py-3 px-4 sm:px-6 w-[28%] font-medium">Task</th>
                      {visibleFields.priority && (
                        <th className="py-3 px-4 font-medium">Priority</th>
                      )}
                      {visibleFields.status && (
                        <th className="py-3 px-4 font-medium">Status</th>
                      )}
                      {visibleFields.members && (
                        <th className="py-3 px-4 font-medium">Members</th>
                      )}
                      {visibleFields.dueDate && (
                        <th className="py-3 px-4 font-medium">Due Date</th>
                      )}
                      {visibleFields.labels && (
                        <th className="py-3 px-4 font-medium">Labels</th>
                      )}
                      {visibleFields.reporter && (
                        <th className="py-3 px-4 font-medium">Reporter</th>
                      )}
                      <th className="py-3 px-4 sm:px-6 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-[13px]">
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => {
                        const priorityColor =
                          task.priority === 'Urgent'
                            ? 'text-red-700 dark:text-red-500'
                            : task.priority === 'High'
                              ? 'text-red-500'
                              : task.priority === 'Medium'
                                ? 'text-amber-500'
                                : 'text-gray-400';

                        return (
                          <tr
                            key={task.id}
                            onClick={() => openTaskDetail(task.id)}
                            className="hover:bg-gray-50/80 dark:hover:bg-[#222225] cursor-pointer transition-colors group relative"
                          >

                            <td className="py-3.5 px-4 sm:px-6 font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {task.title}
                            </td>

                            {visibleFields.priority && (
                              <td className="py-3.5 px-4 font-medium relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePriorityPickerTaskId(
                                      activePriorityPickerTaskId === task.id ? null : task.id,
                                    );
                                  }}
                                  className={clsx(
                                    'flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors',
                                    priorityColor,
                                  )}
                                >
                                  <Signal size={14} className="stroke-[2.5]" />
                                  <span className="capitalize">{task.priority || 'Medium'}</span>
                                </button>

                                {activePriorityPickerTaskId === task.id && (
                                  <div
                                    className="absolute top-10 left-4 w-40 bg-white dark:bg-[#202022] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {priorityOptions.map((p) => (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => handleSetPriority(task.id, p)}
                                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                                      >
                                        {p}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </td>
                            )}

                            {visibleFields.status && (
                              <td className="py-3.5 px-4 font-medium">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <span>{task.status || column.name}</span>
                                </span>
                              </td>
                            )}

                            {visibleFields.members && (
                              <td className="py-3.5 px-4">
                                {task.taskMembers && task.taskMembers.length > 0 ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex -space-x-1.5 overflow-hidden">
                                      {task.taskMembers.slice(0, 3).map((tm) => (
                                        <div
                                          key={tm.id || tm.userId}
                                          className="w-5 h-5 rounded-full overflow-hidden border border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-[8px]"
                                        >
                                          {tm.user?.avatar ? (
                                            <img
                                              src={tm.user.avatar}
                                              alt={tm.user.name || 'Member'}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <span>{(tm.user?.name || 'U').charAt(0).toUpperCase()}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    <span className="text-[12px] font-medium truncate max-w-[110px]">
                                      {task.taskMembers.map((tm) => tm.user?.name || tm.user?.username).join(', ')}
                                    </span>
                                  </div>
                                ) : task.assigneeName && task.assigneeName !== 'Unassigned' ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                      <img
                                        src={
                                          task.assigneeAvatar ||
                                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                                        }
                                        alt="Assignee"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <span className="text-[12px] font-medium">{task.assigneeName}</span>
                                  </div>
                                ) : (
                                  <span className="text-[12px] text-gray-400 font-medium">Unassigned</span>
                                )}
                              </td>
                            )}

                            {visibleFields.dueDate && (
                              <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 font-medium text-[12px]">
                                {task.dueDate ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] font-medium">
                                    <Calendar size={11} />
                                    <span>{task.dueDate}</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )}

                            {visibleFields.labels && (
                              <td className="py-3.5 px-4">
                                {task.labels ? (
                                  <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                                    {task.labels.split(',').map((l, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-medium"
                                      >
                                        <Tag size={9} />
                                        <span>{l.trim()}</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-[11px]">-</span>
                                )}
                              </td>
                            )}

                            {visibleFields.reporter && (
                              <td className="py-3.5 px-4 text-[12px] text-gray-700 dark:text-gray-300 font-medium">
                                {task.reporter ? (
                                  <div className="flex items-center gap-1.5">
                                    <User size={12} className="text-gray-400 shrink-0" />
                                    <span>{task.reporter}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 font-normal">Unassigned</span>
                                )}
                              </td>
                            )}

                            <td className="py-3.5 px-4 sm:px-6 text-right relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRowMenuId(activeRowMenuId === task.id ? null : task.id);
                                }}
                                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 cursor-pointer"
                              >
                                <MoreHorizontal size={16} />
                              </button>

                              {activeRowMenuId === task.id && (
                                <div
                                  className="absolute right-6 top-8 w-36 bg-white dark:bg-[#202022] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveRowMenuId(null);
                                      openTaskDetail(task.id);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveRowMenuId(null);
                                      setConfirmDeleteTask(task);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                  >
                                    Delete Task
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (

                      <tr>
                        <td colSpan={5} className="py-6 px-4 sm:px-6 text-center">
                          <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
                            <span className="text-[13px] font-medium">No tasks in {column.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCreateTaskDefaultColumnId(column.id);
                                setCreateTaskModalOpen(true);
                              }}
                              className="text-[12px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                            >
                              + Add first task
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {filteredTasks.length > 0 && (
                      <tr>
                        <td colSpan={5} className="py-2 px-4 sm:px-6">
                          <button
                            type="button"
                            onClick={() => {
                              setCreateTaskDefaultColumnId(column.id);
                              setCreateTaskModalOpen(true);
                            }}
                            className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white font-medium text-[13px] py-1 transition-colors cursor-pointer"
                          >
                            <Plus size={14} />
                            <span>Add Task</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <ConfirmDialog
        isOpen={!!confirmDeleteTask}
        title={`Delete "${confirmDeleteTask?.title}"?`}
        description="Are you sure you want to permanently delete this task? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="danger"
        icon="delete"
        onConfirm={async () => {
          if (confirmDeleteTask) {
            await deleteTask(confirmDeleteTask.id);
          }
          setConfirmDeleteTask(null);
        }}
        onClose={() => setConfirmDeleteTask(null)}
      />
    </div>
  );
};
