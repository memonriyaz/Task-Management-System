'use client';

import React from 'react';
import { useBoard } from '../../contexts/BoardContext';
import {
  ChevronRight,
  FolderKanban,
  Calendar,
  Signal,
  Plus,
  CheckCircle2,
  Inbox,
  Tag,
  User,
} from 'lucide-react';
import { clsx } from 'clsx';

export const ProjectDetailView: React.FC = () => {
  const {
    selectedProject,
    selectProject,
    activeBoard,
    openTaskDetail,
    setCreateTaskModalOpen,
    visibleFields,
  } = useBoard();

  if (!selectedProject) return null;

  const projectTasks =
    activeBoard?.columns.flatMap((c) =>
      c.tasks.filter((t) => t.projectId === selectedProject.id),
    ) || [];

  const groupedTasks = {
    Tasks: projectTasks.filter((t) => t.status === 'To Do' || t.status === 'Backlog'),
    Doing: projectTasks.filter((t) => t.status === 'Doing' || t.status === 'In Progress'),
    Completed: projectTasks.filter((t) => t.status === 'Completed' || t.status === 'Done'),
  };

  const totalTasks = projectTasks.length;

  const totalColSpan =
    1 +
    (visibleFields?.priority ? 1 : 0) +
    (visibleFields?.status ? 1 : 0) +
    (visibleFields?.members ? 1 : 0) +
    (visibleFields?.dueDate ? 1 : 0) +
    (visibleFields?.labels ? 1 : 0) +
    (visibleFields?.reporter ? 1 : 0);

  return (
    <div className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto p-4 sm:p-8 bg-white dark:bg-[#121214] select-none flex flex-col gap-6 font-sans">

      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-[14px]">
          <button
            type="button"
            onClick={() => selectProject(null)}
            className="text-gray-500 hover:text-black dark:hover:text-white font-medium transition-colors cursor-pointer"
          >
            Projects
          </button>
          <ChevronRight size={15} className="text-gray-400" />
          <span className="font-bold text-gray-900 dark:text-white">
            {selectedProject.name}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCreateTaskModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={15} />
          <span>Add Task</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-[#18181A] border border-gray-200/70 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
            <FolderKanban size={20} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">
              {selectedProject.name}
            </h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              {selectedProject.description || 'Milestone and task tracker'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <Calendar size={13} className="text-gray-400" />
            <span>{selectedProject.dueDate || '12 Sep 2026'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-500 font-semibold">
            <Signal size={13} className="stroke-[2.5]" />
            <span>{selectedProject.priority || 'High'}</span>
          </div>
        </div>
      </div>

      {totalTasks === 0 ? (
        <div className="w-full py-16 px-4 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center gap-3 bg-gray-50/40 dark:bg-[#18181A]/40">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center">
            <Inbox size={24} />
          </div>
          <h3 className="font-bold text-[16px] text-gray-900 dark:text-white">
            No tasks in &quot;{selectedProject.name}&quot; yet
          </h3>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-sm">
            This project has no tasks created inside it. Create your first task to begin tracking progress.
          </p>
          <button
            type="button"
            onClick={() => setCreateTaskModalOpen(true)}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={15} />
            <span>Create First Task</span>
          </button>
        </div>
      ) : (

        <div className="flex flex-col gap-6">
          {(['Tasks', 'Doing', 'Completed'] as const).map((groupKey) => {
            const items = groupedTasks[groupKey] || [];
            return (
              <div key={groupKey} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[14px] text-gray-900 dark:text-white">
                    {groupKey} ({items.length})
                  </h3>
                </div>

                <div className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden bg-white dark:bg-[#18181A]">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-gray-200/75 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#1E1E20]/50 text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                        <th className="py-3 px-4 sm:px-6 w-[28%] font-medium">Task</th>
                        {visibleFields?.priority && (
                          <th className="py-3 px-4 font-medium">Priority</th>
                        )}
                        {visibleFields?.status && (
                          <th className="py-3 px-4 font-medium">Status</th>
                        )}
                        {visibleFields?.members && (
                          <th className="py-3 px-4 font-medium">Members</th>
                        )}
                        {visibleFields?.dueDate && (
                          <th className="py-3 px-4 font-medium">Due Date</th>
                        )}
                        {visibleFields?.labels && (
                          <th className="py-3 px-4 font-medium">Labels</th>
                        )}
                        {visibleFields?.reporter && (
                          <th className="py-3 px-4 font-medium">Reporter</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      {items.length > 0 ? (
                        items.map((task) => (
                          <tr
                            key={task.id}
                            onClick={() => openTaskDetail(task.id)}
                            className="hover:bg-gray-50/60 dark:hover:bg-[#202024] cursor-pointer transition-colors group"
                          >

                            <td className="py-3.5 px-4 sm:px-6 font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {task.title}
                            </td>

                            {visibleFields?.priority && (
                              <td className="py-3.5 px-4 font-medium">
                                <span
                                  className={clsx(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold',
                                    task.priority === 'Urgent' &&
                                      'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50',
                                    task.priority === 'High' &&
                                      'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50',
                                    task.priority === 'Medium' &&
                                      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
                                    task.priority === 'Low' &&
                                      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
                                    (!task.priority || task.priority === 'No Priority') &&
                                      'text-gray-400',
                                  )}
                                >
                                  <Signal size={12} className="stroke-[2.5]" />
                                  <span>{task.priority || 'Medium'}</span>
                                </span>
                              </td>
                            )}

                            {visibleFields?.status && (
                              <td className="py-3.5 px-4 font-medium">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <span>{task.status || groupKey}</span>
                                </span>
                              </td>
                            )}

                            {visibleFields?.members && (
                              <td className="py-3.5 px-4">
                                {task.taskMembers && task.taskMembers.length > 0 ? (
                                  task.taskMembers.length === 1 ? (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                                        {task.taskMembers[0].user?.avatar ? (
                                          <img
                                            src={task.taskMembers[0].user.avatar}
                                            alt={task.taskMembers[0].user.name || 'Member'}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span>
                                            {(task.taskMembers[0].user?.name || 'U')
                                              .charAt(0)
                                              .toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[12px] font-medium truncate max-w-[120px] text-gray-800 dark:text-gray-200">
                                        {task.taskMembers[0].user?.name ||
                                          task.taskMembers[0].user?.username}
                                      </span>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex items-center gap-1.5"
                                      title={task.taskMembers
                                        .map((tm) => tm.user?.name || tm.user?.username)
                                        .join(', ')}
                                    >
                                      <div className="flex -space-x-1.5 overflow-hidden">
                                        {task.taskMembers.slice(0, 3).map((tm) => (
                                          <div
                                            key={tm.id || tm.userId}
                                            className="w-5 h-5 rounded-full overflow-hidden border border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-[8px] shrink-0"
                                          >
                                            {tm.user?.avatar ? (
                                              <img
                                                src={tm.user.avatar}
                                                alt={tm.user.name || 'Member'}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span>
                                                {(tm.user?.name || 'U').charAt(0).toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                        {task.taskMembers.length} members
                                      </span>
                                    </div>
                                  )
                                ) : task.assigneeName && task.assigneeName !== 'Unassigned' ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                                      {task.assigneeAvatar ? (
                                        <img
                                          src={task.assigneeAvatar}
                                          alt={task.assigneeName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span>
                                          {(task.assigneeName || 'U').charAt(0).toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[12px] font-medium text-gray-800 dark:text-gray-200">
                                      {task.assigneeName}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[12px] text-gray-400 font-medium">
                                    Unassigned
                                  </span>
                                )}
                              </td>
                            )}

                            {visibleFields?.dueDate && (
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

                            {visibleFields?.labels && (
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

                            {visibleFields?.reporter && (
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
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={totalColSpan}
                            className="py-4 px-6 text-gray-400 text-[12px]"
                          >
                            No tasks in this section.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
