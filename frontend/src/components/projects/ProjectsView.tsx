'use client';

import React from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { Project } from '../../types';
import {
  FolderKanban,
  Plus,
  MoreHorizontal,
  Signal,
  Calendar,
  User,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    isLoading,
    selectProject,
    deleteProject,
    setCreateProjectModalOpen,
    activeWorkspace,
  } = useBoard();

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-48" />
        <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
      </div>
    );
  }

  const hasProjects = projects && projects.length > 0;

  return (
    <div className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto p-4 sm:p-8 bg-white dark:bg-[#121214] select-none flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-tight">
            Projects
          </h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Manage your workspace initiatives and track milestone deliveries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateProjectModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Project</span>
        </button>
      </div>

      {hasProjects ? (
        <div className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden bg-white dark:bg-[#18181A]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-gray-200/75 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#1E1E20]/50 text-[12px] font-semibold text-gray-400">
                <th className="py-3 px-4 sm:px-6 w-[35%] font-medium">Project Name</th>
                <th className="py-3 px-4 font-medium">Priority</th>
                <th className="py-3 px-4 font-medium">Lead</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Due Date</th>
                <th className="py-3 px-4 sm:px-6 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {projects.map((project) => {
                const priorityColor =
                  project.priority === 'Urgent'
                    ? 'text-red-600 dark:text-red-400'
                    : project.priority === 'High'
                      ? 'text-red-500'
                      : project.priority === 'Medium'
                        ? 'text-amber-500'
                        : 'text-blue-500';

                const statusColor =
                  project.status === 'Released'
                    ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                    : project.status === 'In Progress'
                      ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';

                return (
                  <tr
                    key={project.id}
                    onClick={() => selectProject(project.id)}
                    className="hover:bg-gray-50/70 dark:hover:bg-[#202024] cursor-pointer transition-colors group"
                  >

                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                          <FolderKanban size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[14px] text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {project.name}
                          </span>
                          {project.description && (
                            <span className="text-[12px] text-gray-400 truncate max-w-sm">
                              {project.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className={clsx('flex items-center gap-1.5 font-semibold', priorityColor)}>
                        <Signal size={13} className="stroke-[2.5]" />
                        <span>{project.priority || 'Medium'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img
                            src={
                              project.leadAvatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                            }
                            alt="Lead"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {project.leadName || 'Lead'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={clsx('px-2.5 py-1 rounded-full text-[11px] font-bold', statusColor)}>
                        {project.status || 'In Progress'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-gray-500 dark:text-gray-400 font-medium">
                      {project.dueDate || '12 Sep 2026'}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (

        <div className="w-full my-auto flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#18181A]/50">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 mb-4 shadow-sm">
            <FolderKanban size={32} strokeWidth={1.75} />
          </div>
          <h3 className="text-[17px] font-bold text-gray-900 dark:text-white mb-1.5">
            No projects in {activeWorkspace?.name || 'this workspace'} yet
          </h3>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
            Projects help you organize complex deliverables, track roadmaps, and group related tasks across your team.
          </p>
          <button
            type="button"
            onClick={() => setCreateProjectModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Create First Project</span>
          </button>
        </div>
      )}
    </div>
  );
};
