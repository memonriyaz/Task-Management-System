'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Board,
  Column,
  Task,
  Subtask,
  Comment,
  Project,
  FilterState,
  VisibleFields,
  Workspace,
  WorkspaceMember,
} from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface BoardContextType {

  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (data: { name: string; description?: string }) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;

  boards: Board[];
  activeBoard: Board | null;
  activeBoardId: string | null;
  isLoading: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectBoard: (boardId: string) => void;
  refreshBoards: () => Promise<void>;

  projects: Project[];
  activeProjectId: string | null;
  selectedProject: Project | null;
  selectProject: (id: string | null) => void;
  createProject: (data: {
    name: string;
    description?: string;
    priority?: string;
    leadName?: string;
    leadAvatar?: string;
    dueDate?: string;
    status?: string;
    workspaceId?: string;
  }) => Promise<Project>;
  updateProject: (
    id: string,
    data: {
      name?: string;
      description?: string;
      priority?: string;
      leadName?: string;
      leadAvatar?: string;
      dueDate?: string;
      status?: string;
      workspaceId?: string;
    },
  ) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;

  viewMode: 'board' | 'list';
  setViewMode: (mode: 'board' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'tasks' | 'projects';
  setActiveTab: (tab: 'tasks' | 'projects') => void;

  visibleFields: VisibleFields;
  toggleField: (field: keyof VisibleFields) => void;

  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  toggleFilter: (key: keyof FilterState, value: string) => void;
  clearFilters: () => void;
  isFilterMenuOpen: boolean;
  setFilterMenuOpen: (open: boolean) => void;

  selectedDetailTaskId: string | null;
  selectedDetailTask: Task | null;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;

  createBoard: (data: { name: string; columns?: { name: string; color?: string }[] }) => Promise<Board>;
  updateBoard: (id: string, data: { name?: string; columns?: { id?: string; name: string; color?: string }[] }) => Promise<Board>;
  deleteBoard: (id: string) => Promise<void>;

  createColumn: (name: string, color?: string) => Promise<Column | void>;
  updateColumn: (id: string, name: string, color?: string) => Promise<Column>;
  deleteColumn: (id: string) => Promise<void>;
  reorderColumns: (boardId: string, columnIds: string[]) => Promise<void>;

  createTask: (data: {
    title: string;
    description?: string;
    columnId: string;
    projectId?: string;
    workspaceId?: string;
    memberIds?: string[];
    status?: string;
    priority?: string;
    dueDate?: string;
    labels?: string;
    assigneeName?: string;
    assigneeAvatar?: string;
    resources?: string;
    team?: string;
    reporter?: string;
    subtasks?: {
      title: string;
      priority?: string;
      dueDate?: string;
      assigneeName?: string;
      assigneeAvatar?: string;
      isCompleted?: boolean;
    }[];
  }) => Promise<Task>;
  updateTask: (
    id: string,
    data: {
      title?: string;
      description?: string;
      columnId?: string;
      projectId?: string;
      workspaceId?: string;
      memberIds?: string[];
      status?: string;
      priority?: string;
      dueDate?: string;
      labels?: string;
      assigneeName?: string;
      assigneeAvatar?: string;
      resources?: string;
      team?: string;
      reporter?: string;
      isLocked?: boolean;
      position?: number;
      subtasks?: {
        id?: string;
        title: string;
        priority?: string;
        dueDate?: string;
        assigneeName?: string;
        assigneeAvatar?: string;
        isCompleted?: boolean;
      }[];
    },
  ) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, targetColumnId: string, targetPosition: number, status?: string) => Promise<void>;

  toggleSubtask: (subtaskId: string, taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string, parentId?: string) => Promise<Comment | void>;
  updateComment: (taskId: string, commentId: string, content: string) => Promise<Comment | void>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;

  isCreateTaskModalOpen: boolean;
  setCreateTaskModalOpen: (open: boolean) => void;
  createTaskDefaultColumnId: string | null;
  setCreateTaskDefaultColumnId: (colId: string | null) => void;
  isCreateProjectModalOpen: boolean;
  setCreateProjectModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  isInviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  isCreateWorkspaceModalOpen: boolean;
  setCreateWorkspaceModalOpen: (open: boolean) => void;
  isWorkspaceSettingsModalOpen: boolean;
  setWorkspaceSettingsModalOpen: (open: boolean) => void;

  updateWorkspace: (id: string, data: { name?: string; description?: string }) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  leaveWorkspace: (workspaceId: string) => Promise<void>;
  updateWorkspaceMemberRole: (workspaceId: string, userId: string, role: string) => Promise<WorkspaceMember>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [selectedDetailTaskId, setSelectedDetailTaskId] = useState<string | null>(null);

  const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createTaskDefaultColumnId, setCreateTaskDefaultColumnId] = useState<string | null>(null);
  const [isCreateProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false);
  const [isWorkspaceSettingsModalOpen, setWorkspaceSettingsModalOpen] = useState(false);

  const [visibleFields, setVisibleFields] = useState<VisibleFields>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kanban_fields');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {

        }
      }
    }
    return {
      priority: true,
      members: true,
      dueDate: true,
      labels: true,
      status: true,
      reporter: false,
    };
  });

  const toggleField = (field: keyof VisibleFields) => {
    setVisibleFields((prev) => {
      const next = { ...prev, [field]: !prev[field] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('kanban_fields', JSON.stringify(next));
      }
      return next;
    });
  };

  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    members: [],
    labels: [],
    team: [],
  });
  const [isFilterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[key];
      const exists = current.includes(value);
      const next = exists ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      members: [],
      labels: [],
      team: [],
    });
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);

      const [wsList, boardsData, projectsData] = await Promise.all([
        api.getWorkspaces().catch(() => []),
        api.getBoards().catch(() => []),
        api.getProjects().catch(() => []),
      ]);

      setWorkspaces(wsList);

      if (wsList.length > 0) {
        setActiveWorkspaceId((prev) => {
          if (prev && wsList.some((w) => w.id === prev)) {
            return prev;
          }
          return wsList[0].id;
        });
      }

      setBoards(boardsData);
      setProjects(projectsData);

      if (boardsData.length > 0) {
        setActiveBoardId((prev) => {
          if (prev && boardsData.some((b) => b.id === prev)) {
            return prev;
          }
          return boardsData[0].id;
        });
      } else {
        setActiveBoardId(null);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;

  const scopedBoards = activeWorkspaceId
    ? boards.filter((b) => b.workspaceId === activeWorkspaceId)
    : boards;

  const scopedProjects = activeWorkspaceId
    ? projects.filter((p) => bMatchesWorkspace(p.workspaceId, activeWorkspaceId))
    : projects;

  function bMatchesWorkspace(itemWsId?: string, activeWsId?: string | null) {
    if (!activeWsId) return true;
    return itemWsId === activeWsId;
  }

  const rawActiveBoard =
    scopedBoards.find((b) => b.id === activeBoardId) ||
    scopedBoards[0] ||
    (boards.length > 0 ? boards[0] : null);

  const activeBoard = rawActiveBoard
    ? {
        ...rawActiveBoard,
        columns: rawActiveBoard.columns.map((col) => ({
          ...col,
          tasks: activeWorkspaceId
            ? col.tasks.filter((t) => !t.workspaceId || t.workspaceId === activeWorkspaceId)
            : col.tasks,
        })),
      }
    : null;

  const selectedProject = scopedProjects.find((p) => p.id === activeProjectId) || null;

  let selectedDetailTask: Task | null = null;
  if (selectedDetailTaskId && activeBoard) {
    for (const col of activeBoard.columns) {
      const found = col.tasks.find((t) => t.id === selectedDetailTaskId);
      if (found) {
        selectedDetailTask = found;
        break;
      }
    }
  }

  const selectWorkspace = async (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setActiveProjectId(null);
    closeTaskDetail();
    await fetchData();
  };

  const createWorkspace = async (data: { name: string; description?: string }) => {
    const ws = await api.createWorkspace(data);
    setWorkspaces((prev) => [...prev, ws]);
    await selectWorkspace(ws.id);
    return ws;
  };

  const updateWorkspace = async (id: string, data: { name?: string; description?: string }) => {
    const updated = await api.updateWorkspace(id, data);
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
    return updated;
  };

  const deleteWorkspace = async (id: string) => {
    await api.deleteWorkspace(id);
    const remaining = workspaces.filter((w) => w.id !== id);
    setWorkspaces(remaining);
    if (remaining.length > 0) {
      await selectWorkspace(remaining[0].id);
    } else {
      await fetchData();
    }
  };

  const leaveWorkspace = async (workspaceId: string) => {
    if (!user) return;
    await api.removeWorkspaceMember(workspaceId, user.id);
    const remaining = workspaces.filter((w) => w.id !== workspaceId);
    setWorkspaces(remaining);
    if (remaining.length > 0) {
      await selectWorkspace(remaining[0].id);
    } else {
      await fetchData();
    }
  };

  const updateWorkspaceMemberRole = async (workspaceId: string, userId: string, role: string) => {
    const updated = await api.updateWorkspaceMemberRole(workspaceId, userId, role);
    await refreshWorkspaces();
    return updated;
  };

  const refreshWorkspaces = async () => {
    await fetchData();
  };

  const openTaskDetail = (taskId: string) => {
    setSelectedDetailTaskId(taskId);
  };

  const closeTaskDetail = () => {
    setSelectedDetailTaskId(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const selectBoard = (boardId: string) => {
    setActiveBoardId(boardId);
  };

  const selectProject = (id: string | null) => {
    setActiveProjectId(id);
  };

  const refreshBoards = async () => {
    await fetchData();
  };

  const createProject = async (data: {
    name: string;
    description?: string;
    priority?: string;
    leadName?: string;
    leadAvatar?: string;
    dueDate?: string;
    status?: string;
    workspaceId?: string;
  }) => {
    const payload = {
      ...data,
      workspaceId: data.workspaceId || activeWorkspaceId || undefined,
    };
    const newProject = await api.createProject(payload);
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  };

  const updateProject = async (
    id: string,
    data: {
      name?: string;
      description?: string;
      priority?: string;
      leadName?: string;
      leadAvatar?: string;
      dueDate?: string;
      status?: string;
      workspaceId?: string;
    },
  ) => {
    const updated = await api.updateProject(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProject = async (id: string) => {
    await api.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  const createBoard = async (data: {
    name: string;
    columns?: { name: string; color?: string }[];
  }) => {
    const newBoard = await api.createBoard(data);
    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
    return newBoard;
  };

  const updateBoard = async (
    id: string,
    data: { name?: string; columns?: { id?: string; name: string; color?: string }[] },
  ) => {
    const updated = await api.updateBoard(id, data);
    setBoards((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  const deleteBoard = async (id: string) => {
    await api.deleteBoard(id);
    setBoards((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      if (activeBoardId === id) {
        setActiveBoardId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const createColumn = async (name: string, color?: string) => {
    if (!activeBoardId) return;
    const newColumn = await api.createColumn(activeBoardId, { name, color });
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id === activeBoardId) {
          return { ...b, columns: [...b.columns, { ...newColumn, tasks: [] }] };
        }
        return b;
      }),
    );
    return newColumn;
  };

  const updateColumn = async (id: string, name: string, color?: string) => {
    const updated = await api.updateColumn(id, { name, color });
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((col) => (col.id === id ? { ...col, ...updated } : col)),
      })),
    );
    return updated;
  };

  const deleteColumn = async (id: string) => {
    await api.deleteColumn(id);
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.filter((col) => col.id !== id),
      })),
    );
  };

  const reorderColumns = async (boardId: string, columnIds: string[]) => {

    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== boardId) return b;
        const columnMap = new Map(b.columns.map((c) => [c.id, c]));
        const reordered = columnIds
          .map((id) => columnMap.get(id))
          .filter((c): c is Column => Boolean(c));
        return { ...b, columns: reordered };
      }),
    );
    await api.reorderColumns(boardId, columnIds);
  };

  const createTask = async (data: {
    title: string;
    description?: string;
    columnId: string;
    projectId?: string;
    workspaceId?: string;
    memberIds?: string[];
    status?: string;
    priority?: string;
    dueDate?: string;
    labels?: string;
    assigneeName?: string;
    assigneeAvatar?: string;
    resources?: string;
    team?: string;
    reporter?: string;
    subtasks?: {
      title: string;
      priority?: string;
      dueDate?: string;
      assigneeName?: string;
      assigneeAvatar?: string;
      isCompleted?: boolean;
    }[];
  }) => {
    const payload = {
      ...data,
      workspaceId: data.workspaceId || activeWorkspaceId || undefined,
    };
    const newTask = await api.createTask(payload);
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((col) => {
          if (col.id === data.columnId) {
            return { ...col, tasks: [...col.tasks, newTask] };
          }
          return col;
        }),
      })),
    );
    return newTask;
  };

  const updateTask = async (
    id: string,
    data: {
      title?: string;
      description?: string;
      columnId?: string;
      projectId?: string;
      workspaceId?: string;
      memberIds?: string[];
      status?: string;
      priority?: string;
      dueDate?: string;
      labels?: string;
      assigneeName?: string;
      assigneeAvatar?: string;
      resources?: string;
      team?: string;
      reporter?: string;
      isLocked?: boolean;
      position?: number;
      subtasks?: {
        id?: string;
        title: string;
        priority?: string;
        dueDate?: string;
        assigneeName?: string;
        assigneeAvatar?: string;
        isCompleted?: boolean;
      }[];
    },
  ) => {
    const updated = await api.updateTask(id, data);
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        })),
      })),
    );
    return updated;
  };

  const deleteTask = async (id: string) => {
    await api.deleteTask(id);
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== id),
        })),
      })),
    );
    if (selectedDetailTaskId === id) {
      closeTaskDetail();
    }
  };

  const moveTask = async (
    taskId: string,
    targetColumnId: string,
    targetPosition: number,
    status?: string,
  ) => {

    setBoards((prev) => {
      let movedTask: Task | null = null;
      const cleanBoards = prev.map((b) => ({
        ...b,
        columns: b.columns.map((col) => {
          const found = col.tasks.find((t) => t.id === taskId);
          if (found) {
            movedTask = { ...found, columnId: targetColumnId, status: status || col.name };
          }
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
        }),
      }));

      if (!movedTask) return prev;

      return cleanBoards.map((b) => ({
        ...b,
        columns: b.columns.map((col) => {
          if (col.id === targetColumnId) {
            const nextTasks = [...col.tasks];
            nextTasks.splice(targetPosition, 0, movedTask!);
            return { ...col, tasks: nextTasks };
          }
          return col;
        }),
      }));
    });

    try {
      await api.moveTask(taskId, { targetColumnId, targetPosition, status });
    } catch (err) {
      console.error('Failed to persist task move:', err);
      await fetchData();
    }
  };

  const toggleSubtask = async (subtaskId: string, taskId: string) => {
    const updated = await api.toggleSubtask(subtaskId);
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                subtasks: t.subtasks.map((st) => (st.id === subtaskId ? updated : st)),
              };
            }
            return t;
          }),
        })),
      })),
    );
  };

  const addComment = async (taskId: string, content: string, parentId?: string) => {
    const authorName = user?.name || user?.username || 'You';
    const authorAvatar =
      user?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
    const newComment = await api.addComment(taskId, content, authorName, authorAvatar, parentId);

    const newActivity = {
      id: `act_${Date.now()}`,
      taskId,
      type: 'comment',
      description: parentId
        ? `${authorName} replied to a comment`
        : `${authorName} commented on task`,
      createdAt: new Date().toISOString(),
    };

    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => {
            if (t.id === taskId) {
              const updatedActivities = [newActivity, ...(t.activities || [])];
              if (parentId) {
                const existing = t.comments || [];
                const updatedComments = existing.map((c) => {
                  if (c.id === parentId) {
                    return {
                      ...c,
                      replies: [...(c.replies || []), newComment],
                    };
                  }
                  return c;
                });
                return { ...t, comments: updatedComments, activities: updatedActivities };
              } else {
                return {
                  ...t,
                  comments: [newComment, ...(t.comments || [])],
                  activities: updatedActivities,
                };
              }
            }
            return t;
          }),
        })),
      })),
    );

    api
      .getTask(taskId)
      .then((freshTask) => {
        if (freshTask) {
          setBoards((prev) =>
            prev.map((b) => ({
              ...b,
              columns: b.columns.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) => (t.id === taskId ? freshTask : t)),
              })),
            })),
          );
        }
      })
      .catch(() => {});

    return newComment;
  };

  const updateComment = async (taskId: string, commentId: string, content: string) => {
    const updated = await api.editComment(taskId, commentId, content);
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => {
            if (t.id === taskId) {
              const updatedComments = (t.comments || []).map((c) => {
                if (c.id === commentId) {
                  return { ...c, content: updated.content };
                }
                if (c.replies) {
                  return {
                    ...c,
                    replies: c.replies.map((r) =>
                      r.id === commentId ? { ...r, content: updated.content } : r,
                    ),
                  };
                }
                return c;
              });
              return { ...t, comments: updatedComments };
            }
            return t;
          }),
        })),
      })),
    );
    return updated;
  };

  const deleteComment = async (taskId: string, commentId: string) => {
    await api.deleteComment(taskId, commentId);
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => {
            if (t.id === taskId) {
              const filteredComments = (t.comments || [])
                .filter((c) => c.id !== commentId)
                .map((c) => ({
                  ...c,
                  replies: (c.replies || []).filter((r) => r.id !== commentId),
                }));
              return { ...t, comments: filteredComments };
            }
            return t;
          }),
        })),
      })),
    );
  };

  return (
    <BoardContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        selectWorkspace,
        createWorkspace,
        refreshWorkspaces,

        boards: scopedBoards,
        activeBoard,
        activeBoardId,
        isLoading,
        isSidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        selectBoard,
        refreshBoards,

        projects: scopedProjects,
        activeProjectId,
        selectedProject,
        selectProject,
        createProject,
        updateProject,
        deleteProject,

        viewMode,
        setViewMode,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,

        visibleFields,
        toggleField,

        filters,
        setFilters,
        toggleFilter,
        clearFilters,
        isFilterMenuOpen,
        setFilterMenuOpen,

        selectedDetailTaskId,
        selectedDetailTask,
        openTaskDetail,
        closeTaskDetail,

        createBoard,
        updateBoard,
        deleteBoard,

        createColumn,
        updateColumn,
        deleteColumn,
        reorderColumns,

        createTask,
        updateTask,
        deleteTask,
        moveTask,

        toggleSubtask,
        addComment,
        updateComment,
        deleteComment,

        isCreateTaskModalOpen,
        setCreateTaskModalOpen,
        createTaskDefaultColumnId,
        setCreateTaskDefaultColumnId,
        isCreateProjectModalOpen,
        setCreateProjectModalOpen,
        isProfileModalOpen,
        setProfileModalOpen,
        isInviteModalOpen,
        setInviteModalOpen,
        isCreateWorkspaceModalOpen,
        setCreateWorkspaceModalOpen,
        isWorkspaceSettingsModalOpen,
        setWorkspaceSettingsModalOpen,

        updateWorkspace,
        deleteWorkspace,
        leaveWorkspace,
        updateWorkspaceMemberRole,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};
