import {
  AuthResponse,
  Board,
  Column,
  Task,
  Subtask,
  Comment,
  Project,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('kanban_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {

        }

        if (response.status === 401 && !endpoint.includes('/auth/') && typeof window !== 'undefined') {
          localStorage.removeItem('kanban_token');
          localStorage.removeItem('kanban_user');
          window.dispatchEvent(new Event('auth:unauthorized'));
        }

        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.error(`API Request Failed [${endpoint}]:`, err);
      throw err;
    }
  }

  async guestLogin(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/guest', {
      method: 'POST',
    });
  }

  async login(email: string, password?: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async loginGoogle(data?: {
    credential?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  async getMe(): Promise<User & { boards: Board[]; projects: Project[] }> {
    return this.request<User & { boards: Board[]; projects: Project[] }>('/auth/me');
  }

  async updateProfile(data: {
    name?: string;
    username?: string;
    title?: string;
    avatar?: string;
  }): Promise<User> {
    return this.request<User>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getBoards(): Promise<Board[]> {
    return this.request<Board[]>('/boards');
  }

  async getBoard(id: string): Promise<Board> {
    return this.request<Board>(`/boards/${id}`);
  }

  async createBoard(data: {
    name: string;
    columns?: { name: string; color?: string }[];
  }): Promise<Board> {
    return this.request<Board>('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBoard(
    id: string,
    data: {
      name?: string;
      columns?: { id?: string; name: string; color?: string }[];
    },
  ): Promise<Board> {
    return this.request<Board>(`/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBoard(id: string): Promise<void> {
    return this.request<void>(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: {
    name: string;
    description?: string;
    priority?: string;
    leadName?: string;
    leadAvatar?: string;
    dueDate?: string;
    status?: string;
  }): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(
    id: string,
    data: {
      name?: string;
      description?: string;
      priority?: string;
      leadName?: string;
      leadAvatar?: string;
      dueDate?: string;
      status?: string;
    },
  ): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async createColumn(
    boardId: string,
    data: { name: string; color?: string; position?: number },
  ): Promise<Column> {
    return this.request<Column>(`/columns/${boardId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateColumn(
    id: string,
    data: { name?: string; color?: string; position?: number },
  ): Promise<Column> {
    return this.request<Column>(`/columns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteColumn(id: string): Promise<void> {
    return this.request<void>(`/columns/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderColumns(boardId: string, columnIds: string[]): Promise<any> {
    return this.request<any>(`/columns/reorder/${boardId}`, {
      method: 'POST',
      body: JSON.stringify({ columnIds }),
    });
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(data: {
    title: string;
    description?: string;
    columnId: string;
    projectId?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    labels?: string;
    assigneeName?: string;
    assigneeAvatar?: string;
    resources?: string;
    team?: string;
    reporter?: string;
    position?: number;
    subtasks?: {
      title: string;
      priority?: string;
      dueDate?: string;
      assigneeName?: string;
      assigneeAvatar?: string;
      isCompleted?: boolean;
    }[];
  }): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      columnId?: string;
      projectId?: string;
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
  ): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addComment(
    taskId: string,
    content: string,
    authorName?: string,
    authorAvatar?: string,
    parentId?: string,
  ): Promise<Comment> {
    return this.request<Comment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, authorName, authorAvatar, parentId }),
    });
  }

  async moveTask(
    id: string,
    data: {
      targetColumnId: string;
      targetPosition: number;
      status?: string;
    },
  ): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleSubtask(id: string): Promise<Subtask> {
    return this.request<Subtask>(`/subtasks/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async updateSubtask(
    id: string,
    data: {
      title?: string;
      priority?: string;
      dueDate?: string;
      assigneeName?: string;
      assigneeAvatar?: string;
      isCompleted?: boolean;
    },
  ): Promise<Subtask> {
    return this.request<Subtask>(`/subtasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return this.request<Workspace[]>('/workspaces');
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return this.request<Workspace>(`/workspaces/${id}`);
  }

  async createWorkspace(data: { name: string; description?: string }): Promise<Workspace> {
    return this.request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkspace(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Workspace> {
    return this.request<Workspace>(`/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkspace(id: string): Promise<void> {
    return this.request<void>(`/workspaces/${id}`, {
      method: 'DELETE',
    });
  }

  async getWorkspaceMembers(
    workspaceId: string,
    search?: string,
  ): Promise<WorkspaceMember[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<WorkspaceMember[]>(`/workspaces/${workspaceId}/members${q}`);
  }

  async updateWorkspaceMemberRole(
    workspaceId: string,
    userId: string,
    role: string,
  ): Promise<WorkspaceMember> {
    return this.request<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    return this.request<void>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async createWorkspaceInvitation(
    workspaceId: string,
    data: { email: string; role?: string },
  ): Promise<WorkspaceInvitation & { inviteUrl?: string }> {
    return this.request<WorkspaceInvitation & { inviteUrl?: string }>(
      `/workspaces/${workspaceId}/invitations`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  }

  async getWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    return this.request<WorkspaceInvitation[]>(`/workspaces/${workspaceId}/invitations`);
  }

  async revokeWorkspaceInvitation(workspaceId: string, invitationId: string): Promise<void> {
    return this.request<void>(`/workspaces/${workspaceId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  }

  async getInvitationInfo(token: string): Promise<WorkspaceInvitation> {
    return this.request<WorkspaceInvitation>(`/invitations/${token}`);
  }

  async acceptInvitation(
    token: string,
  ): Promise<{ message: string; workspaceId: string; membership: WorkspaceMember }> {
    return this.request<{ message: string; workspaceId: string; membership: WorkspaceMember }>(
      `/invitations/${token}/accept`,
      {
        method: 'POST',
      },
    );
  }

  async getTaskMembers(taskId: string): Promise<User[]> {
    return this.request<User[]>(`/tasks/${taskId}/members`);
  }

  async assignTaskMember(taskId: string, userId: string): Promise<User> {
    return this.request<User>(`/tasks/${taskId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async removeTaskMember(taskId: string, userId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/tasks/${taskId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async editComment(taskId: string, commentId: string, content: string): Promise<Comment> {
    return this.request<Comment>(`/tasks/${taskId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(taskId: string, commentId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async getNotifications(): Promise<any[]> {
    return this.request<any[]>('/notifications');
  }

  async markNotificationRead(id: string): Promise<any> {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    });
  }

  async uploadFile(
    file: File,
  ): Promise<{ success: boolean; url: string; name: string; size: number; mimetype: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'File upload failed' }));
      throw new Error(err.message || 'File upload failed');
    }

    return res.json();
  }
}

export const api = new ApiService();
