'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceMembers } from '../../hooks/useWorkspace';
import { Task, Subtask, ResourceItem } from '../../types';
import { WorkspaceMemberSelector } from '../members/WorkspaceMemberSelector';
import { DatePickerPopover } from '../common/DatePickerPopover';
import { api } from '../../services/api';
import {
  Sidebar,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Plus,
  Tag,
  Paperclip,
  Send,
  Calendar,
  Signal,
  Check,
  PanelRightClose,
  PanelRightOpen,
  X,
  Trash2,
  ExternalLink,
  FileText,
  User,
  Users,
  CheckCircle2,
  Reply,
  CornerDownRight,
  MessageSquare,
  UserPlus,
  UserCheck,
  Edit2,
  Clock,
  Activity as ActivityIcon,
  History,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TaskDetailView: React.FC = () => {
  const {
    selectedDetailTask,
    closeTaskDetail,
    updateTask,
    deleteTask,
    addComment,
    updateComment,
    deleteComment,
    activeBoard,
    refreshBoards,
    activeWorkspace,
    setInviteModalOpen,
  } = useBoard();
  const { user } = useAuth();
  const { data: workspaceMembers } = useWorkspaceMembers(activeWorkspace?.id || selectedDetailTask?.workspaceId);

  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
  const [isRightMemberMenuOpen, setIsRightMemberMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [isReporterMenuOpen, setIsReporterMenuOpen] = useState(false);

  const [activeDiscussionTab, setActiveDiscussionTab] = useState<'comments' | 'activity'>('comments');
  const [newCommentText, setNewCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  const [customTeamName, setCustomTeamName] = useState('');
  const [customReporterName, setCustomReporterName] = useState('');
  const [isAddingCustomLabel, setIsAddingCustomLabel] = useState(false);
  const [customLabelInput, setCustomLabelInput] = useState('');

  const [activeSubtaskMenuId, setActiveSubtaskMenuId] = useState<string | null>(null);
  const [activeSubtaskMemberMenuId, setActiveSubtaskMemberMenuId] = useState<string | null>(null);

  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);
  const [isConfirmDeleteTaskOpen, setIsConfirmDeleteTaskOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedDetailTask) {
      setTaskTitle(selectedDetailTask.title || '');
      setTaskDescription(selectedDetailTask.description || '');
    }
  }, [selectedDetailTask?.id, selectedDetailTask?.title, selectedDetailTask?.description]);

  const activeMembersList = React.useMemo(() => {
    const list: { id: string; name: string; email?: string; avatar?: string }[] = [];
    const seen = new Set<string>();

    if (workspaceMembers && workspaceMembers.length > 0) {
      for (const m of workspaceMembers) {
        if (m.user && !seen.has(m.user.id)) {
          seen.add(m.user.id);
          list.push({
            id: m.user.id,
            name: m.user.name || m.user.username || 'Member',
            email: m.user.email,
            avatar: m.user.avatar || '',
          });
        }
      }
    }

    if (user && !seen.has(user.id)) {
      list.unshift({
        id: user.id,
        name: user.name || user.username || 'You',
        email: user.email,
        avatar: user.avatar || '',
      });
    }

    return list;
  }, [workspaceMembers, user]);

  const currentLabels = React.useMemo(() => {
    return selectedDetailTask?.labels
      ? selectedDetailTask.labels.split(',').map((l) => l.trim()).filter(Boolean)
      : [];
  }, [selectedDetailTask?.labels]);

  const labelsList = React.useMemo(() => {
    const defaultLabels = ['Research', 'Design', 'Development', 'Testing', 'Deployment'];
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
    currentLabels.forEach((l) => set.add(l));
    return Array.from(set);
  }, [activeBoard, currentLabels]);

  const teamOptions = React.useMemo(() => {
    const set = new Set<string>();
    activeBoard?.columns?.forEach((col) => {
      col.tasks?.forEach((t) => {
        if (t.team && t.team.trim()) set.add(t.team.trim());
      });
    });
    if (selectedDetailTask?.team && selectedDetailTask.team.trim()) {
      set.add(selectedDetailTask.team.trim());
    }
    return Array.from(set);
  }, [activeBoard, selectedDetailTask?.team]);

  if (!selectedDetailTask) return null;

  const task = selectedDetailTask;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const priorityOptions = ['No Priority', 'Urgent', 'High', 'Medium', 'Low'];

  let resourcesList: ResourceItem[] = [];
  try {
    if (task.resources) {
      resourcesList = JSON.parse(task.resources);
    }
  } catch (err) {
    resourcesList = [];
  }

  const handleToggleLabel = async (label: string) => {
    let nextLabels: string[];
    if (currentLabels.includes(label)) {
      nextLabels = currentLabels.filter((l) => l !== label);
    } else {
      nextLabels = [...currentLabels, label];
    }
    await updateTask(task.id, { labels: nextLabels.join(', ') });
    showToast(`Updated labels`);
  };

  const handleAddCustomLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customLabelInput.trim();
    if (!trimmed) return;
    if (!currentLabels.includes(trimmed)) {
      const nextLabels = [...currentLabels, trimmed];
      await updateTask(task.id, { labels: nextLabels.join(', ') });
      showToast(`Added label "${trimmed}"`);
    }
    setCustomLabelInput('');
    setIsAddingCustomLabel(false);
  };

  const handlePriorityChange = async (newPriority: string) => {
    setIsPriorityMenuOpen(false);
    await updateTask(task.id, { priority: newPriority });
    showToast(`Priority changed to ${newPriority}`);
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsStatusMenuOpen(false);
    const targetCol = activeBoard?.columns.find((c) => c.name === newStatus);
    await updateTask(task.id, {
      status: newStatus,
      columnId: targetCol?.id || task.columnId,
    });
    showToast(`Moved to ${newStatus}`);
  };

  const handleMemberChange = async (member: { name: string; avatar?: string }) => {
    setIsMemberMenuOpen(false);
    await updateTask(task.id, {
      assigneeName: member.name,
      assigneeAvatar: member.avatar || '',
    });
    showToast(`Assigned to ${member.name}`);
  };

  const handleUnassignMember = async () => {
    setIsMemberMenuOpen(false);
    await updateTask(task.id, {
      assigneeName: '',
      assigneeAvatar: '',
    });
    showToast('Task unassigned');
  };

  const handleDueDateChange = async (dateStr: string) => {
    setIsDateMenuOpen(false);
    await updateTask(task.id, { dueDate: dateStr });
    showToast(`Due date set to ${dateStr}`);
  };

  const handleTeamChange = async (team: string) => {
    setIsTeamMenuOpen(false);
    await updateTask(task.id, { team });
    showToast(`Team set to ${team}`);
  };

  const handleAddCustomTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTeamName.trim()) return;
    await handleTeamChange(customTeamName.trim());
    setCustomTeamName('');
  };

  const handleReporterChange = async (reporter: string) => {
    setIsReporterMenuOpen(false);
    await updateTask(task.id, { reporter });
    showToast(`Reporter set to ${reporter}`);
  };

  const handleAddCustomReporter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReporterName.trim()) return;
    await handleReporterChange(customReporterName.trim());
    setCustomReporterName('');
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceName.trim()) return;
    const url =
      resourceUrl.trim() ||
      (resourceName.startsWith('http') ? resourceName : `https://${resourceName.toLowerCase().replace(/\s+/g, '')}.com`);
    const next = [...resourcesList, { name: resourceName.trim(), url }];
    await updateTask(task.id, { resources: JSON.stringify(next) });
    setResourceName('');
    setResourceUrl('');
    setIsAddingResource(false);
    showToast(`Added resource "${resourceName.trim()}"`);
  };

  const handleDeleteResource = async (idx: number) => {
    const next = resourcesList.filter((_, i) => i !== idx);
    await updateTask(task.id, { resources: JSON.stringify(next) });
    showToast('Resource removed');
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    await addComment(task.id, newCommentText.trim());
    setNewCommentText('');
    showToast('Comment posted');
  };

  const handlePostReply = async (parentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await addComment(task.id, replyText.trim(), parentId);
    setReplyText('');
    setReplyingToCommentId(null);
    showToast('Reply posted');
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    const existing = task.subtasks || [];
    await updateTask(task.id, {
      subtasks: [
        ...existing.map((s) => ({
          id: s.id,
          title: s.title,
          priority: s.priority,
          dueDate: s.dueDate,
          assigneeName: s.assigneeName,
          assigneeAvatar: s.assigneeAvatar,
          isCompleted: s.isCompleted,
        })),
        {
          title: newSubtaskTitle.trim(),
          priority: 'Medium',
          dueDate: '18 Sep 2026',
          assigneeName: user?.name || user?.username || '',
          assigneeAvatar: user?.avatar || '',
          isCompleted: false,
        },
      ],
    });
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
    showToast('Subtask added');
  };

  const handleUpdateSubtaskPriority = async (subtaskId: string, priority: string) => {
    const nextSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, priority } : s,
    );
    await updateTask(task.id, {
      subtasks: nextSubtasks.map((s) => ({
        id: s.id,
        title: s.title,
        priority: s.priority,
        dueDate: s.dueDate,
        assigneeName: s.assigneeName,
        assigneeAvatar: s.assigneeAvatar,
        isCompleted: s.isCompleted,
      })),
    });
    setActiveSubtaskMenuId(null);
    showToast('Subtask priority updated');
  };

  const handleUpdateSubtaskMember = async (subtaskId: string, member: { name: string; avatar: string }) => {
    const nextSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId
        ? { ...s, assigneeName: member.name, assigneeAvatar: member.avatar }
        : s,
    );
    await updateTask(task.id, {
      subtasks: nextSubtasks.map((s) => ({
        id: s.id,
        title: s.title,
        priority: s.priority,
        dueDate: s.dueDate,
        assigneeName: s.assigneeName,
        assigneeAvatar: s.assigneeAvatar,
        isCompleted: s.isCompleted,
      })),
    });
    setActiveSubtaskMemberMenuId(null);
    showToast('Subtask member updated');
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const nextSubtasks = task.subtasks.filter((s) => s.id !== subtaskId);
    await updateTask(task.id, {
      subtasks: nextSubtasks.map((s) => ({
        id: s.id,
        title: s.title,
        priority: s.priority,
        dueDate: s.dueDate,
        assigneeName: s.assigneeName,
        assigneeAvatar: s.assigneeAvatar,
        isCompleted: s.isCompleted,
      })),
    });
    showToast('Subtask deleted');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Uploading file...');
      const res = await api.uploadFile(file);
      const existingResources = task.resources ? JSON.parse(task.resources) : [];
      const updatedResources = [
        ...existingResources,
        { name: res.name || file.name, url: res.url },
      ];
      await updateTask(task.id, { resources: JSON.stringify(updatedResources) });
      showToast('Attachment uploaded');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload attachment');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      await updateComment(task.id, commentId, editingCommentText.trim());
      setEditingCommentId(null);
      setEditingCommentText('');
      showToast('Comment updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to update comment');
    }
  };

  const handleDeleteCommentAction = (commentId: string) => {
    setConfirmDeleteCommentId(commentId);
  };

  const executeDeleteComment = async () => {
    if (!confirmDeleteCommentId) return;
    try {
      await deleteComment(task.id, confirmDeleteCommentId);
      showToast('Comment deleted');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete comment');
    } finally {
      setConfirmDeleteCommentId(null);
    }
  };

  const executeDeleteTask = async () => {
    try {
      await deleteTask(task.id);
      setIsConfirmDeleteTaskOpen(false);
      closeTaskDetail();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task');
    }
  };

  const handleTitleBlur = async () => {
    if (taskTitle.trim() && taskTitle !== task.title) {
      await updateTask(task.id, { title: taskTitle.trim() });
      showToast('Title updated');
    }
  };

  const handleDescriptionBlur = async () => {
    if (taskDescription !== (task.description || '')) {
      await updateTask(task.id, { description: taskDescription });
      showToast('Description updated');
    }
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 h-full flex flex-col bg-white dark:bg-[#121214] select-none overflow-hidden relative">

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-[12px] font-semibold shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-400 dark:text-green-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <header className="h-14 px-4 sm:px-6 border-b border-gray-200/75 dark:border-gray-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={closeTaskDetail}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-[13px] transition-colors cursor-pointer border border-gray-200/80 dark:border-gray-800"
            title="Back to Tasks Board"
          >
            <ChevronLeft size={16} className="shrink-0" />
            <span className="hidden xs:inline">Back</span>
          </button>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-1.5 text-[13px]">
            <button
              type="button"
              onClick={closeTaskDetail}
              className="font-semibold text-gray-500 hover:text-black dark:hover:text-white hover:underline transition-colors cursor-pointer"
            >
              Tasks
            </button>
            <span className="text-gray-300 dark:text-gray-700 font-light">/</span>
            <span className="text-gray-900 dark:text-white font-bold truncate max-w-[200px] sm:max-w-[320px]">
              {task.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 relative">
          <button
            type="button"
            onClick={() => setIsConfirmDeleteTaskOpen(true)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-colors cursor-pointer"
            title="Delete Task"
          >
            <Trash2 size={15} />
          </button>

          <button
            type="button"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-colors"
            title="Toggle Details Panel"
          >
            {isRightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">

        <div
          className={clsx(
            'flex-1 min-h-0 overflow-y-auto p-6 sm:p-10 flex flex-col gap-8 transition-all duration-200',
            isRightPanelOpen ? 'max-w-4xl' : 'w-full max-w-none',
          )}
        >

          <div>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onBlur={handleTitleBlur}
              disabled={task.isLocked}
              placeholder="Task title..."
              className="text-[26px] sm:text-[30px] font-extrabold text-gray-900 dark:text-white tracking-tight w-full bg-transparent focus:outline-none focus:border-b border-gray-300 dark:border-gray-700 pb-1 disabled:opacity-80"
            />
          </div>

          <div className="flex flex-col gap-1">
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              disabled={task.isLocked}
              rows={3}
              placeholder="Add details and description about this task... (Click here to type)"
              className="text-[14px] leading-relaxed text-gray-700 dark:text-gray-200 w-full bg-transparent hover:bg-gray-50/70 dark:hover:bg-gray-800/40 focus:bg-white dark:focus:bg-[#18181A] p-2.5 -ml-2.5 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-all resize-y placeholder:text-gray-400 placeholder:italic disabled:opacity-80"
            />
          </div>

          <div className="flex flex-col gap-4 text-[13px]">

            <div className="flex items-center gap-6">
              <span className="w-24 text-gray-400 font-medium">Members</span>
              <div className="flex items-center gap-2 relative flex-wrap">

                {task.taskMembers && task.taskMembers.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.taskMembers.map((tm) => (
                      <div
                        key={tm.id || tm.userId}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[12px] font-medium border border-gray-200/60 dark:border-gray-700/60 group"
                      >
                        <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-[9px]">
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
                        <span>{tm.user?.name || tm.user?.username || 'Member'}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.removeTaskMember(task.id, tm.userId);
                              await refreshBoards();
                              showToast(`Removed ${tm.user?.name || 'member'} from task`);
                            } catch (err: any) {
                              showToast(err.message || 'Failed to remove member');
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 cursor-pointer"
                          title="Remove member"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : task.assigneeName && task.assigneeName !== 'Unassigned' ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-[12px] font-medium border border-gray-200/60 dark:border-gray-700/60">
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 shrink-0">
                      <img
                        src={
                          task.assigneeAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                        }
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span>{task.assigneeName}</span>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setIsMemberMenuOpen(!isMemberMenuOpen)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-[12px] font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <span>+ Add</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Calendar size={13} />
                  <span>{task.dueDate || '31 Jul'}</span>
                </button>

                {isMemberMenuOpen && (
                  <div className="absolute top-9 left-0 z-50">
                    <WorkspaceMemberSelector
                      workspaceId={task.workspaceId || activeWorkspace?.id || ''}
                      assignedUserIds={task.taskMembers?.map((tm) => tm.userId) || []}
                      onSelectMember={async (userId) => {
                        try {
                          await api.assignTaskMember(task.id, userId);
                          await refreshBoards();
                          showToast('Member assigned to task');
                        } catch (err: any) {
                          showToast(err.message || 'Failed to assign member');
                        }
                      }}
                      onRemoveMember={async (userId) => {
                        try {
                          await api.removeTaskMember(task.id, userId);
                          await refreshBoards();
                          showToast('Member removed from task');
                        } catch (err: any) {
                          showToast(err.message || 'Failed to remove member');
                        }
                      }}
                      onClose={() => setIsMemberMenuOpen(false)}
                    />
                  </div>
                )}

                {isDateMenuOpen && (
                  <div className="absolute top-9 left-28 z-50">
                    <DatePickerPopover
                      currentDate={task.dueDate}
                      onSelectDate={handleDueDateChange}
                      onClose={() => setIsDateMenuOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="w-24 text-gray-400 font-medium">Labels</span>
              <div className="flex items-center flex-wrap gap-2">
                {labelsList.map((label) => {
                  const isActive = currentLabels.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleToggleLabel(label)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-colors cursor-pointer',
                        isActive
                          ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-semibold shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                      )}
                    >
                      <Tag size={12} className={isActive ? 'text-black dark:text-white' : 'text-gray-400'} />
                      <span>{label}</span>
                    </button>
                  );
                })}

                {isAddingCustomLabel ? (
                  <form onSubmit={handleAddCustomLabel} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={customLabelInput}
                      onChange={(e) => setCustomLabelInput(e.target.value)}
                      placeholder="Label name..."
                      autoFocus
                      className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-[12px] text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={!customLabelInput.trim()}
                      className="px-2.5 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomLabel(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomLabel(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-[12px] font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Custom Label</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-6">
              <span className="w-24 text-gray-400 font-medium pt-1">Resources</span>
              <div className="flex-1 flex flex-col gap-2">

                {resourcesList.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-1">
                    {resourcesList.map((res, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-[13px] max-w-md group"
                      >
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline truncate"
                        >
                          <FileText size={14} className="shrink-0 text-gray-500" />
                          <span className="truncate">{res.name}</span>
                          <ExternalLink size={12} className="shrink-0 text-gray-400" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(idx)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="Remove Resource"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isAddingResource ? (
                  <form onSubmit={handleAddResource} className="flex flex-col gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 max-w-md">
                    <input
                      type="text"
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                      placeholder="Resource name (e.g. Swagger API Docs)"
                      autoFocus
                      className="text-[13px] px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E20] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      placeholder="URL (e.g. http://localhost:4000/api/docs)"
                      className="text-[13px] px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E20] focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingResource(false)}
                        className="px-3 py-1 text-[12px] text-gray-500 hover:text-black dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[12px] font-semibold"
                      >
                        Save Resource
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingResource(true)}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-black dark:hover:text-white text-[13px] font-medium transition-colors"
                    >
                      <Paperclip size={13} />
                      <span>Add document or link...</span>
                    </button>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[12px] text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      Upload File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2">
              <ChevronDown size={16} className="text-gray-400" />
              <h3 className="font-bold text-[14px] text-gray-900 dark:text-white">
                Subtasks ({task.subtasks?.length || 0})
              </h3>
            </div>

            <div className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-visible bg-white dark:bg-[#18181A]">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200/75 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#1E1E20]/50 text-[12px] font-semibold text-gray-400">
                    <th className="py-2.5 px-4 font-medium w-[38%]">Task</th>
                    <th className="py-2.5 px-4 font-medium">Priority</th>
                    <th className="py-2.5 px-4 font-medium">Members</th>
                    <th className="py-2.5 px-4 font-medium">Due Date</th>
                    <th className="py-2.5 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {task.subtasks && task.subtasks.length > 0 ? (
                    task.subtasks.map((subtask) => {
                      const priorityColor =
                        subtask.priority === 'High'
                          ? 'text-red-500'
                          : subtask.priority === 'Medium'
                            ? 'text-amber-500'
                            : 'text-blue-500';

                      return (
                        <tr key={subtask.id} className="hover:bg-gray-50/50 dark:hover:bg-[#222225] transition-colors relative">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                            {subtask.title}
                          </td>

                          <td className="py-3 px-4 relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSubtaskMenuId(
                                  activeSubtaskMenuId === subtask.id ? null : subtask.id,
                                )
                              }
                              className={clsx('flex items-center gap-1.5 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-0.5 rounded-lg transition-colors', priorityColor)}
                            >
                              <Signal size={13} className="stroke-[2.5]" />
                              <span>{subtask.priority || 'Medium'}</span>
                            </button>

                            {activeSubtaskMenuId === subtask.id && (
                              <div className="absolute top-9 left-2 w-36 bg-white dark:bg-[#202022] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                                {priorityOptions.map((p) => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => handleUpdateSubtaskPriority(subtask.id, p)}
                                    className="w-full text-left px-2 py-1 rounded-lg text-[12px] font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSubtaskMemberMenuId(
                                  activeSubtaskMemberMenuId === subtask.id ? null : subtask.id,
                                )
                              }
                              className="hover:scale-110 transition-transform"
                            >
                              {subtask.assigneeName === 'CN' ? (
                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-[9px] flex items-center justify-center">
                                  CN
                                </div>
                              ) : subtask.assigneeName ? (
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <img
                                    src={
                                      subtask.assigneeAvatar ||
                                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                                    }
                                    alt="Assignee"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 font-bold text-[10px] flex items-center justify-center">
                                  +
                                </div>
                              )}
                            </button>

                            {activeSubtaskMemberMenuId === subtask.id && (
                              <div className="absolute top-9 left-2 w-48 bg-white dark:bg-[#202022] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-56 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubtaskMember(subtask.id, { name: '', avatar: '' })}
                                  className="w-full text-left px-2 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 mb-1"
                                >
                                  • Unassigned
                                </button>
                                {activeMembersList.map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleUpdateSubtaskMember(subtask.id, { name: m.name, avatar: m.avatar || '' })}
                                    className="w-full text-left px-2 py-1.5 rounded-lg text-[12px] font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                                      {m.avatar ? (
                                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span>{(m.name || 'U').charAt(0).toUpperCase()}</span>
                                      )}
                                    </div>
                                    <span className="truncate text-gray-900 dark:text-white">{m.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium text-[12px]">
                            {subtask.dueDate || '12 Sep 2026'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(subtask.id)}
                              className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                              title="Delete Subtask"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : null}

                  <tr>
                    <td colSpan={5} className="py-2.5 px-4">
                      {isAddingSubtask ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddSubtask();
                              if (e.key === 'Escape') setIsAddingSubtask(false);
                            }}
                            placeholder="Enter subtask title..."
                            autoFocus
                            className="text-[13px] px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent flex-1 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddSubtask}
                            className="px-3.5 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[12px] font-semibold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingSubtask(false)}
                            className="p-1 text-gray-400"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingSubtask(true)}
                          className="flex items-center gap-1.5 text-gray-500 hover:text-black dark:hover:text-white font-medium text-[13px] transition-colors"
                        >
                          <Plus size={14} />
                          <span>Add Subtasks</span>
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {(() => {
            const allComments = task.comments || [];
            const topLevelComments = allComments.filter((c) => !c.parentId);

            const getRepliesForComment = (commentId: string) => {
              const directReplies = allComments.find((c) => c.id === commentId)?.replies || [];
              const flatReplies = allComments.filter((c) => c.parentId === commentId);
              const map = new Map<string, typeof allComments[0]>();
              directReplies.forEach((r) => map.set(r.id, r));
              flatReplies.forEach((r) => map.set(r.id, r));
              return Array.from(map.values()).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
            };

            const allActivities = task.activities || [];

            return (
              <div className="flex flex-col gap-4 pt-4 border-t border-gray-200/80 dark:border-gray-800">

                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveDiscussionTab('comments')}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer',
                        activeDiscussionTab === 'comments'
                          ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                          : 'text-gray-500 hover:text-black dark:hover:text-white',
                      )}
                    >
                      <MessageSquare size={14} />
                      <span>Comments ({allComments.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDiscussionTab('activity')}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer',
                        activeDiscussionTab === 'activity'
                          ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                          : 'text-gray-500 hover:text-black dark:hover:text-white',
                      )}
                    >
                      <History size={14} />
                      <span>Activity History ({allActivities.length})</span>
                    </button>
                  </div>
                </div>

                {activeDiscussionTab === 'comments' ? (
                  <>

                    {topLevelComments.length > 0 ? (
                      <div className="flex flex-col gap-3.5">
                        {topLevelComments.map((comment) => {
                          const replies = getRepliesForComment(comment.id);
                          const isReplying = replyingToCommentId === comment.id;
                          const isEditing = editingCommentId === comment.id;

                          return (
                            <div
                              key={comment.id}
                              className="group flex flex-col gap-3 p-4 rounded-2xl bg-gray-50/70 dark:bg-[#18181A] border border-gray-200/70 dark:border-gray-800 transition-colors"
                            >

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[11px] shrink-0">
                                    {comment.authorAvatar ? (
                                      <img
                                        src={comment.authorAvatar}
                                        alt={comment.authorName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{(comment.authorName || 'U').charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <span className="font-bold text-[13px] text-gray-900 dark:text-white">
                                    {comment.authorName}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditComment(comment.id, comment.content)}
                                    className="p-1 text-gray-400 hover:text-black dark:hover:text-white rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    title="Edit Comment"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCommentAction(comment.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                    title="Delete Comment"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="pl-9 flex flex-col gap-2 pt-1">
                                  <textarea
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    rows={2}
                                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#202022] text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white resize-none"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveCommentEdit(comment.id)}
                                      className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[12px] font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentText('');
                                      }}
                                      className="px-2.5 py-1 text-gray-500 hover:text-black dark:hover:text-white text-[12px] font-medium transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[13px] text-gray-800 dark:text-gray-200 pl-9 leading-relaxed whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              )}

                              <div className="pl-9 flex items-center gap-3 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingToCommentId(isReplying ? null : comment.id);
                                    setReplyText('');
                                  }}
                                  className="text-[12px] font-semibold text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Reply size={13} />
                                  <span>{isReplying ? 'Cancel' : 'Reply'}</span>
                                </button>
                              </div>

                              {replies.length > 0 && (
                                <div className="pl-4 sm:pl-6 ml-3 sm:ml-4 border-l-2 border-gray-200 dark:border-gray-700/80 flex flex-col gap-2.5 pt-1">
                                  {replies.map((reply) => {
                                    const isReplyEditing = editingCommentId === reply.id;
                                    return (
                                      <div
                                        key={reply.id}
                                        className="group/reply flex flex-col gap-1.5 p-3 rounded-xl bg-white dark:bg-[#202022] border border-gray-100 dark:border-gray-800/80 shadow-2xs"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                                              {reply.authorAvatar ? (
                                                <img
                                                  src={reply.authorAvatar}
                                                  alt={reply.authorName}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <span>{(reply.authorName || 'U').charAt(0).toUpperCase()}</span>
                                              )}
                                            </div>
                                            <span className="font-bold text-[12px] text-gray-900 dark:text-white">
                                              {reply.authorName}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                              {reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                            <button
                                              type="button"
                                              onClick={() => handleStartEditComment(reply.id, reply.content)}
                                              className="p-0.5 text-gray-400 hover:text-black dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                              title="Edit Reply"
                                            >
                                              <Edit2 size={11} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteCommentAction(reply.id)}
                                              className="p-0.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                              title="Delete Reply"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>
                                        </div>

                                        {isReplyEditing ? (
                                          <div className="pl-7 flex flex-col gap-2 pt-1">
                                            <textarea
                                              value={editingCommentText}
                                              onChange={(e) => setEditingCommentText(e.target.value)}
                                              rows={2}
                                              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#18181A] text-[12px] text-gray-900 dark:text-white focus:outline-none resize-none"
                                            />
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => handleSaveCommentEdit(reply.id)}
                                                className="px-2.5 py-0.5 bg-black dark:bg-white text-white dark:text-black rounded text-[11px] font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
                                              >
                                                Save
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingCommentId(null);
                                                  setEditingCommentText('');
                                                }}
                                                className="px-2 py-0.5 text-gray-500 hover:text-black dark:hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-[12px] text-gray-700 dark:text-gray-300 pl-7 leading-snug whitespace-pre-wrap">
                                            {reply.content}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {isReplying && (
                                <form
                                  onSubmit={(e) => handlePostReply(comment.id, e)}
                                  className="flex items-center gap-2 pl-4 sm:pl-6 ml-3 sm:ml-4 border-l-2 border-blue-500 pt-1 animate-in fade-in"
                                >
                                  <div className="flex-1 flex items-center justify-between px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E20] shadow-2xs">
                                    <input
                                      type="text"
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder={`Reply to ${comment.authorName}...`}
                                      autoFocus
                                      className="w-full bg-transparent text-[12px] text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!replyText.trim()}
                                      className="p-1 rounded-lg text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-30 cursor-pointer"
                                    >
                                      <Send size={13} />
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-[12px] text-gray-400 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        No comments yet. Start the conversation below.
                      </div>
                    )}

                    <form
                      onSubmit={handlePostComment}
                      className="flex items-center justify-between px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18181A] shadow-xs"
                    >
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent text-[13px] text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400"
                      />
                      <div className="flex items-center gap-2.5 text-gray-400">
                        <button
                          type="submit"
                          disabled={!newCommentText.trim()}
                          className="p-1 text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (

                  <div className="flex flex-col gap-3">
                    {allActivities.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {allActivities.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#18181A] border border-gray-200/70 dark:border-gray-800 text-[12px]"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <ActivityIcon size={12} />
                              </div>
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                {act.description}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 shrink-0">
                              {act.createdAt ? new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'recently'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-[12px] text-gray-400 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        No activity recorded on this task yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {isRightPanelOpen && (
          <aside className="w-80 shrink-0 h-full border-l border-gray-200/80 dark:border-gray-800 bg-[#FBFBFC] dark:bg-[#161618] p-5 overflow-y-auto flex flex-col gap-6 text-[13px]">

            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 font-bold text-[13px]">
                  <ChevronDown size={14} />
                  <span>Details</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Plus size={14} className="hover:text-black dark:hover:text-white cursor-pointer" />
                </div>
              </div>

              <div className="flex items-center justify-between py-1 relative">
                <span className="text-gray-400 font-medium">Status</span>
                <button
                  type="button"
                  onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                  className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{task.status || 'To Do'}</span>
                </button>

                {isStatusMenuOpen && (
                  <div className="absolute right-0 top-8 w-44 bg-white dark:bg-[#202022] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {['To Do', 'Doing', 'Completed', 'On Hold'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusChange(status)}
                        className="w-full text-left px-3 py-1.5 text-[13px] font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <span>{status}</span>
                        {task.status === status && <Check size={13} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-1 relative">
                <span className="text-gray-400 font-medium">Priority</span>
                <button
                  type="button"
                  onClick={() => setIsPriorityMenuOpen(!isPriorityMenuOpen)}
                  className="flex items-center gap-1.5 font-semibold text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors"
                >
                  <Signal size={13} className="stroke-[2.5]" />
                  <span>{task.priority || 'Urgent'}</span>
                  <ChevronDown size={13} />
                </button>

                {isPriorityMenuOpen && (
                  <div className="absolute right-0 top-8 w-48 bg-white dark:bg-[#202022] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
                    <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Priority
                    </div>
                    {priorityOptions.map((opt) => {
                      const isSelected =
                        task.priority === opt || (!task.priority && opt === 'Medium');
                      const optColor =
                        opt === 'Urgent'
                          ? 'text-red-600 dark:text-red-400'
                          : opt === 'High'
                            ? 'text-red-500'
                            : opt === 'Medium'
                              ? 'text-amber-500'
                              : opt === 'Low'
                                ? 'text-blue-500'
                                : 'text-gray-400';

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handlePriorityChange(opt)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-[13px] font-medium"
                        >
                          <div className={clsx('flex items-center gap-2', optColor)}>
                            {opt === 'No Priority' ? <span>•</span> : <Signal size={13} className="stroke-[2.5]" />}
                            <span>{opt}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-gray-900 dark:text-white stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-1 relative">
                <span className="text-gray-400 font-medium">Members</span>
                <button
                  type="button"
                  onClick={() => setIsRightMemberMenuOpen(!isRightMemberMenuOpen)}
                  className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
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
                            <span>{(task.taskMembers[0].user?.name || 'U').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="truncate max-w-[130px]">
                          {task.taskMembers[0].user?.name || task.taskMembers[0].user?.username}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1.5"
                        title={task.taskMembers.map((tm) => tm.user?.name || tm.user?.username).join(', ')}
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
                                <span>{(tm.user?.name || 'U').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-[12px] font-medium">
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
                            alt={task.assigneeName || 'Member'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(task.assigneeName || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="truncate max-w-[130px]">{task.assigneeName}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 font-normal">Unassigned</span>
                  )}
                </button>

                {isRightMemberMenuOpen && (
                  <div className="absolute right-0 top-8 z-50">
                    <WorkspaceMemberSelector
                      workspaceId={task.workspaceId || activeWorkspace?.id || ''}
                      assignedUserIds={task.taskMembers?.map((tm) => tm.userId) || []}
                      onSelectMember={async (userId) => {
                        try {
                          await api.assignTaskMember(task.id, userId);
                          await refreshBoards();
                          showToast('Member assigned to task');
                        } catch (err: any) {
                          showToast(err.message || 'Failed to assign member');
                        }
                      }}
                      onRemoveMember={async (userId) => {
                        try {
                          await api.removeTaskMember(task.id, userId);
                          await refreshBoards();
                          showToast('Member removed from task');
                        } catch (err: any) {
                          showToast(err.message || 'Failed to remove member');
                        }
                      }}
                      onClose={() => setIsRightMemberMenuOpen(false)}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-1 relative">
                <span className="text-gray-400 font-medium">Dates</span>
                <button
                  type="button"
                  onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                  className="font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {task.dueDate || '29 Jul'}
                </button>
              </div>

              <div className="flex items-start justify-between py-1 gap-2">
                <span className="text-gray-400 font-medium pt-0.5">Labels</span>
                <div className="flex items-center flex-wrap justify-end gap-1 max-w-[160px]">
                  {task.labels ? (
                    task.labels
                      .split(',')
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .map((label, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-medium"
                        >
                          {label}
                        </span>
                      ))
                  ) : (
                    <span className="text-gray-400 font-normal text-[12px]">None</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-1 relative">
                <span className="text-gray-400 font-medium">Teams</span>
                <button
                  type="button"
                  onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                  className="font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {task.team ? (
                    <span>{task.team}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 font-normal">None</span>
                  )}
                </button>

                {isTeamMenuOpen && (
                  <div className="absolute right-0 top-8 w-52 bg-white dark:bg-[#202022] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 select-none font-sans">
                    <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Select Team
                    </div>

                    <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5 custom-scrollbar">

                      <button
                        type="button"
                        onClick={() => handleTeamChange('')}
                        className={clsx(
                          'w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[12px] font-medium transition-colors cursor-pointer',
                          !task.team
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
                        )}
                      >
                        <span>None (General)</span>
                        {!task.team && <Check size={14} className="text-gray-900 dark:text-white" />}
                      </button>

                      {teamOptions.map((tm) => {
                        const isSelected = task.team === tm;
                        return (
                          <button
                            key={tm}
                            type="button"
                            onClick={() => handleTeamChange(tm)}
                            className={clsx(
                              'w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[12px] font-medium transition-colors cursor-pointer',
                              isSelected
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
                            )}
                          >
                            <span>{tm}</span>
                            {isSelected && <Check size={14} className="text-gray-900 dark:text-white" />}
                          </button>
                        );
                      })}
                    </div>

                    <form onSubmit={handleAddCustomTeam} className="pt-2 mt-1 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1">
                      <input
                        type="text"
                        value={customTeamName}
                        onChange={(e) => setCustomTeamName(e.target.value)}
                        placeholder="New team..."
                        className="flex-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400"
                      />
                      <button
                        type="submit"
                        disabled={!customTeamName.trim()}
                        className="px-2.5 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[11px] font-bold disabled:opacity-30 cursor-pointer"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-1 relative">
                <span className="text-gray-400 font-medium">Reporter</span>
                <button
                  type="button"
                  onClick={() => setIsReporterMenuOpen(!isReporterMenuOpen)}
                  className="font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {task.reporter ? (
                    <span>{task.reporter}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 font-normal">Unassigned</span>
                  )}
                </button>

                {isReporterMenuOpen && (
                  <div className="absolute right-0 top-8 w-56 bg-white dark:bg-[#202022] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 select-none font-sans">
                    <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Select Reporter
                    </div>

                    <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5 custom-scrollbar">

                      <button
                        type="button"
                        onClick={() => handleReporterChange('')}
                        className={clsx(
                          'w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[12px] font-medium transition-colors cursor-pointer',
                          !task.reporter
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-5 h-5 rounded-full border border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                            -
                          </div>
                          <span className="truncate">Unassigned</span>
                        </div>
                        {!task.reporter && <Check size={14} className="text-gray-900 dark:text-white shrink-0" />}
                      </button>

                      {activeMembersList.map((m) => {
                        const isSelected = task.reporter === m.name;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleReporterChange(m.name)}
                            className={clsx(
                              'w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[12px] font-medium transition-colors cursor-pointer',
                              isSelected
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                                {m.avatar ? (
                                  <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{(m.name || 'U').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="truncate">{m.name}</span>
                            </div>
                            {isSelected && <Check size={14} className="text-gray-900 dark:text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <form onSubmit={handleAddCustomReporter} className="pt-2 mt-1 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1">
                      <input
                        type="text"
                        value={customReporterName}
                        onChange={(e) => setCustomReporterName(e.target.value)}
                        placeholder="Custom reporter..."
                        className="flex-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400"
                      />
                      <button
                        type="submit"
                        disabled={!customReporterName.trim()}
                        className="px-2.5 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[11px] font-bold disabled:opacity-30 cursor-pointer"
                      >
                        Set
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-3 border-t border-gray-200/80 dark:border-gray-800">
              <div className="flex items-center gap-2 text-gray-500 font-bold text-[13px]">
                <ChevronDown size={14} />
                <span>Updates ({task.activities?.length || 0})</span>
              </div>

              <div className="flex flex-col gap-3 pl-1 text-[12px] max-h-72 overflow-y-auto pr-1">
                {task.activities && task.activities.length > 0 ? (
                  task.activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                        {act.type === 'priority' ? (
                          <Signal size={11} />
                        ) : act.type === 'member' ? (
                          <User size={11} />
                        ) : act.type === 'date' ? (
                          <Calendar size={11} />
                        ) : act.type === 'comment' ? (
                          <MessageSquare size={11} />
                        ) : (
                          <Check size={11} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {act.description}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {act.createdAt ? new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-[12px] py-1">No updates yet</div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteCommentId}
        title="Delete Comment?"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete Comment"
        cancelText="Cancel"
        variant="danger"
        icon="delete"
        onConfirm={executeDeleteComment}
        onClose={() => setConfirmDeleteCommentId(null)}
      />

      <ConfirmDialog
        isOpen={isConfirmDeleteTaskOpen}
        title={`Delete "${task.title}"?`}
        description="Are you sure you want to permanently delete this task along with its comments and attachments? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="danger"
        icon="delete"
        onConfirm={executeDeleteTask}
        onClose={() => setIsConfirmDeleteTaskOpen(false)}
      />
    </div>
  );
};
