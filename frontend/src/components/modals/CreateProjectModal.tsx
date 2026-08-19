'use client';

import React, { useState } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceMembers } from '../../hooks/useWorkspace';
import { DatePickerPopover } from '../common/DatePickerPopover';
import { X, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

export const CreateProjectModal: React.FC = () => {
  const { isCreateProjectModalOpen, setCreateProjectModalOpen, createProject, activeWorkspace } =
    useBoard();
  const { user } = useAuth();
  const { data: workspaceMembers } = useWorkspaceMembers(activeWorkspace?.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('High');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [leadName, setLeadName] = useState(() => user?.name || user?.username || 'You');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const memberList = React.useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();

    if (workspaceMembers) {
      for (const m of workspaceMembers) {
        if (m.user) {
          const mName = m.user.name || m.user.username || 'Member';
          if (!seen.has(mName)) {
            seen.add(mName);
            list.push({ id: m.user.id, name: mName });
          }
        }
      }
    }

    if (user) {
      const uName = user.name || user.username || 'You';
      if (!seen.has(uName)) {
        list.unshift({ id: user.id, name: uName });
      }
    }

    return list;
  }, [workspaceMembers, user]);

  if (!isCreateProjectModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createProject({
        name: name.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate.trim(),
        leadName: leadName || user?.name || 'Lead',
        status: 'In Progress',
      });
      setName('');
      setDescription('');
      setError('');
      setCreateProjectModalOpen(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={() => setCreateProjectModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1E1E20] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col gap-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
            Create Project
          </h2>
          <button
            type="button"
            onClick={() => setCreateProjectModalOpen(false)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Mobile App 2.0"
              className={clsx(
                'w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none',
                error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
              )}
            />
            {error && <span className="text-[11px] text-red-500">{error}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Project goals and deliverables..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="Urgent" className="bg-white dark:bg-gray-800">Urgent</option>
                <option value="High" className="bg-white dark:bg-gray-800">High</option>
                <option value="Medium" className="bg-white dark:bg-gray-800">Medium</option>
                <option value="Low" className="bg-white dark:bg-gray-800">Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                Lead
              </label>
              <select
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
              >
                {memberList.map((m) => (
                  <option key={m.id} value={m.name} className="bg-white dark:bg-gray-800">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Calendar size={13} className="text-gray-400" />
              <span>Target Due Date</span>
            </label>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white flex items-center justify-between cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <span>{dueDate || 'Select target date...'}</span>
              <Calendar size={14} className="text-gray-400" />
            </button>

            {isDatePickerOpen && (
              <div className="absolute top-16 left-0 z-50">
                <DatePickerPopover
                  currentDate={dueDate}
                  onSelectDate={(d) => {
                    setDueDate(d);
                    setIsDatePickerOpen(false);
                  }}
                  onClose={() => setIsDatePickerOpen(false)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateProjectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:text-black dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[13px] font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
