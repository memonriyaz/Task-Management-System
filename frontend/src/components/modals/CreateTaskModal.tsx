'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceMembers } from '../../hooks/useWorkspace';
import { DatePickerPopover } from '../common/DatePickerPopover';
import { ResourceItem } from '../../types';
import { api } from '../../services/api';
import {
  X,
  Plus,
  Calendar,
  Tag,
  Signal,
  FolderKanban,
  Users,
  Check,
  UserPlus,
  Paperclip,
  FileText,
  Trash2,
  Building2,
  User,
} from 'lucide-react';
import { clsx } from 'clsx';

export const CreateTaskModal: React.FC = () => {
  const {
    isCreateTaskModalOpen,
    setCreateTaskModalOpen,
    createTaskDefaultColumnId,
    activeBoard,
    projects,
    activeProjectId,
    activeTab,
    activeWorkspace,
    setInviteModalOpen,
    createTask,
  } = useBoard();
  const { user } = useAuth();

  const { data: workspaceMembers } = useWorkspaceMembers(activeWorkspace?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [selectedLabels, setSelectedLabels] = useState<string[]>(['Deployment']);
  const [customLabels, setCustomLabels] = useState<string[]>([]);
  const [isAddingCustomLabel, setIsAddingCustomLabel] = useState(false);
  const [customLabelInput, setCustomLabelInput] = useState('');

  const [team, setTeam] = useState('');
  const [isAddingCustomTeam, setIsAddingCustomTeam] = useState(false);
  const [customTeamInput, setCustomTeamInput] = useState('');

  const [reporter, setReporter] = useState('');
  const [isAddingCustomReporter, setIsAddingCustomReporter] = useState(false);
  const [customReporterInput, setCustomReporterInput] = useState('');

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [columnId, setColumnId] = useState('');
  const [selectedProjId, setSelectedProjId] = useState<string>(
    activeTab === 'projects' && activeProjectId ? activeProjectId : '',
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const defaultLabels = ['Research', 'Design', 'Development', 'Testing', 'Deployment'];
  const allAvailableLabels = useMemo(() => {
    const set = new Set<string>(defaultLabels);
    activeBoard?.columns?.forEach((col) => {
      col.tasks?.forEach((t) => {
        if (t.labels) {
          t.labels.split(',').forEach((l) => {
            const trimmed = l.trim();
            if (trimmed) set.add(trimmed);
          });
        }
      });
    });
    customLabels.forEach((cl) => {
      if (cl.trim()) set.add(cl.trim());
    });
    return Array.from(set);
  }, [activeBoard, customLabels]);

  const teamOptions = useMemo(() => {
    const set = new Set<string>();
    activeBoard?.columns?.forEach((col) => {
      col.tasks?.forEach((t) => {
        if (t.team && t.team.trim()) set.add(t.team.trim());
      });
    });
    if (team && team.trim()) set.add(team.trim());
    return Array.from(set);
  }, [activeBoard, team]);

  const activeMembersList = useMemo(() => {
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

  const handleToggleLabel = (lbl: string) => {
    setSelectedLabels((prev) =>
      prev.includes(lbl) ? prev.filter((l) => l !== lbl) : [...prev, lbl],
    );
  };

  const handleAddCustomLabelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customLabelInput.trim();
    if (!trimmed) return;
    if (!customLabels.includes(trimmed)) {
      setCustomLabels((prev) => [...prev, trimmed]);
    }
    if (!selectedLabels.includes(trimmed)) {
      setSelectedLabels((prev) => [...prev, trimmed]);
    }
    setCustomLabelInput('');
    setIsAddingCustomLabel(false);
  };

  const handleAddCustomTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTeamInput.trim()) return;
    setTeam(customTeamInput.trim());
    setCustomTeamInput('');
    setIsAddingCustomTeam(false);
  };

  const handleAddCustomReporterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReporterInput.trim()) return;
    setReporter(customReporterInput.trim());
    setCustomReporterInput('');
    setIsAddingCustomReporter(false);
  };

  const handleAddResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceName.trim() || !newResourceUrl.trim()) return;
    setResources((prev) => [
      ...prev,
      { name: newResourceName.trim(), url: newResourceUrl.trim() },
    ]);
    setNewResourceName('');
    setNewResourceUrl('');
    setIsAddingResource(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      setResources((prev) => [
        ...prev,
        { name: res.name || file.name, url: res.url },
      ]);
    } catch (err: any) {
      console.error('Failed to upload file:', err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveResource = (index: number) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSubtask = () => {
    setSubtasks((prev) => [...prev, '']);
  };

  const handleSubtaskChange = (idx: number, val: string) => {
    setSubtasks((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const targetColumnId =
    columnId || createTaskDefaultColumnId || activeBoard?.columns[0]?.id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetCol = activeBoard?.columns?.find((c) => c.id === targetColumnId);

      const formattedSubtasks = subtasks
        .filter((s) => s.trim() !== '')
        .map((s) => ({
          title: s.trim(),
          priority: 'Medium',
          dueDate: '18 Sep 2026',
          isCompleted: false,
        }));

      const finalProjectId =
        selectedProjId || (activeTab === 'projects' && activeProjectId ? activeProjectId : undefined);

      const firstMember = workspaceMembers?.find((m) =>
        selectedMemberIds.includes(m.user.id),
      )?.user;

      await createTask({
        title: title.trim(),
        description: description.trim(),
        columnId: targetColumnId,
        projectId: finalProjectId || undefined,
        workspaceId: activeWorkspace?.id || undefined,
        memberIds: selectedMemberIds,
        status: targetCol?.name || 'To Do',
        priority,
        dueDate,
        labels: selectedLabels.join(', '),
        assigneeName: firstMember
          ? (firstMember.name || firstMember.username || 'Member')
          : '',
        assigneeAvatar: firstMember?.avatar || '',
        team: team.trim() || undefined,
        reporter: reporter.trim() || undefined,
        resources: resources.length > 0 ? JSON.stringify(resources) : undefined,
        subtasks: formattedSubtasks,
      });

      setTitle('');
      setDescription('');
      setSelectedMemberIds([]);
      setSelectedLabels(['Deployment']);
      setTeam('');
      setReporter('');
      setResources([]);
      setSubtasks(['']);
      setError('');
      setCreateTaskModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCreateTaskModalOpen || !activeBoard) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={() => setCreateTaskModalOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#1E1E20] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col gap-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto font-sans custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
            Create New Task
          </h2>
          <button
            type="button"
            onClick={() => setCreateTaskModalOpen(false)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Write API Documentation"
              className={clsx(
                'w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors',
                error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
              )}
            />
            {error && <span className="text-[11px] text-red-500">{error}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add details about this task..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Users size={13} className="text-gray-400" />
                <span>Members &amp; Due Date</span>
              </label>
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus size={12} />
                <span>+ Invite Teammate</span>
              </button>
            </div>

            <div className="flex items-center flex-wrap gap-2">

              {workspaceMembers &&
                workspaceMembers.map((m) => {
                  const isSelected = selectedMemberIds.includes(m.user.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMemberSelection(m.user.id)}
                      className={clsx(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[12px] font-medium border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400',
                      )}
                    >
                      <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shrink-0 flex items-center justify-center text-[9px]">
                        {m.user.avatar ? (
                          <img src={m.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{(m.user.name || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span>{m.user.name || m.user.username}</span>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[12px] font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 cursor-pointer transition-colors"
                >
                  <Calendar size={12} />
                  <span>{dueDate || 'Set Date'}</span>
                </button>

                {isDatePickerOpen && (
                  <div className="absolute top-8 left-0 z-50 animate-in fade-in zoom-in-95 duration-100">
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
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Tag size={13} className="text-gray-400" />
                <span>Labels</span>
              </label>
              {!isAddingCustomLabel && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomLabel(true)}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>+ Custom Label</span>
                </button>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {allAvailableLabels.map((lbl) => {
                const isSelected = selectedLabels.includes(lbl);
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => handleToggleLabel(lbl)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black font-semibold shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                    )}
                  >
                    <Tag size={11} className={isSelected ? 'text-white dark:text-black' : 'text-gray-400'} />
                    <span>{lbl}</span>
                  </button>
                );
              })}

              {isAddingCustomLabel && (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customLabelInput}
                    onChange={(e) => setCustomLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomLabelSubmit(e);
                      } else if (e.key === 'Escape') {
                        setIsAddingCustomLabel(false);
                      }
                    }}
                    placeholder="New label name..."
                    autoFocus
                    className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-[12px] text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomLabelSubmit}
                    disabled={!customLabelInput.trim()}
                    className="px-2.5 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomLabel(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Building2 size={13} className="text-gray-400" />
                  <span>Team (Optional)</span>
                </label>
                {!isAddingCustomTeam && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomTeam(true)}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    + Custom
                  </button>
                )}
              </div>

              {isAddingCustomTeam ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customTeamInput}
                    onChange={(e) => setCustomTeamInput(e.target.value)}
                    placeholder="Team name..."
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-[12px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTeamSubmit}
                    disabled={!customTeamInput.trim()}
                    className="px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-40"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomTeam(false)}
                    className="p-1 text-gray-400 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="" className="bg-white dark:bg-gray-800">
                    No Team (General)
                  </option>
                  {teamOptions.map((t) => (
                    <option key={t} value={t} className="bg-white dark:bg-gray-800">
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <User size={13} className="text-gray-400" />
                  <span>Reporter (Optional)</span>
                </label>
                {!isAddingCustomReporter && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomReporter(true)}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    + Custom
                  </button>
                )}
              </div>

              {isAddingCustomReporter ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customReporterInput}
                    onChange={(e) => setCustomReporterInput(e.target.value)}
                    placeholder="Custom reporter name..."
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-[12px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomReporterSubmit}
                    disabled={!customReporterInput.trim()}
                    className="px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-40"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomReporter(false)}
                    className="p-1 text-gray-400 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <select
                  value={reporter}
                  onChange={(e) => setReporter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="" className="bg-white dark:bg-gray-800">
                    Unassigned
                  </option>
                  {activeMembersList.map((m) => (
                    <option key={m.id} value={m.name} className="bg-white dark:bg-gray-800">
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FolderKanban size={13} className="text-gray-400" />
                <span>Project</span>
              </label>
              <select
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-gray-800">
                  None (General)
                </option>
                {projects &&
                  projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-gray-800">
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                Column Status
              </label>
              <select
                value={targetColumnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
              >
                {activeBoard.columns.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-gray-800">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Signal size={13} className="text-gray-400" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="Urgent" className="bg-white dark:bg-gray-800">🔴 Urgent</option>
                <option value="High" className="bg-white dark:bg-gray-800">🟠 High</option>
                <option value="Medium" className="bg-white dark:bg-gray-800">🟡 Medium</option>
                <option value="Low" className="bg-white dark:bg-gray-800">🔵 Low</option>
                <option value="No Priority" className="bg-white dark:bg-gray-800">⚪ No Priority</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Paperclip size={13} className="text-gray-400" />
                <span>Resources &amp; Attachments</span>
              </label>
              <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500">
                <button
                  type="button"
                  onClick={() => setIsAddingResource(true)}
                  className="hover:text-black dark:hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add Link/Doc</span>
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:text-black dark:hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Paperclip size={12} />
                  <span>Upload File</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {resources.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {resources.map((res, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-[12px]"
                  >
                    <div className="flex items-center gap-2 truncate text-blue-600 dark:text-blue-400 font-medium">
                      <FileText size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{res.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(idx)}
                      className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isAddingResource && (
              <div className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={newResourceName}
                  onChange={(e) => setNewResourceName(e.target.value)}
                  placeholder="Doc title (e.g. Design Specs)"
                  className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-[12px] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none"
                />
                <input
                  type="url"
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-[12px] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleAddResourceSubmit}
                    disabled={!newResourceName.trim() || !newResourceUrl.trim()}
                    className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-40"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingResource(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
              Subtasks (Optional)
            </label>
            <div className="flex flex-col gap-2">
              {subtasks.map((st, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={st}
                    onChange={(e) => handleSubtaskChange(idx, e.target.value)}
                    placeholder={`Subtask ${idx + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent text-gray-900 dark:text-white focus:outline-none"
                  />
                  {subtasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddSubtask}
                className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-[12px] font-semibold text-gray-500 hover:text-black dark:hover:text-white hover:border-gray-400 transition-colors flex items-center justify-center gap-1 mt-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Subtask</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setCreateTaskModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
