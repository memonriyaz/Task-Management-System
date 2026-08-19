export interface Subtask {
  id: string;
  title: string;
  priority?: string;
  dueDate?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  isCompleted: boolean;
  taskId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  taskId: string;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  taskId: string;
  createdAt: string;
}

export interface ResourceItem {
  name: string;
  url: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  username?: string;
  title?: string;
  avatar?: string;
  isGuest: boolean;
  createdAt: string;
}

export interface TaskMember {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  labels?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  resources?: string;
  team?: string;
  reporter?: string;
  isLocked?: boolean;
  position: number;
  columnId: string;
  projectId?: string;
  workspaceId?: string;
  taskMembers?: TaskMember[];
  subtasks: Subtask[];
  comments: Comment[];
  activities: Activity[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Column {
  id: string;
  name: string;
  color?: string;
  position: number;
  boardId: string;
  tasks: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Board {
  id: string;
  name: string;
  userId: string;
  workspaceId?: string;
  columns: Column[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  priority: string;
  leadName: string;
  leadAvatar?: string;
  dueDate?: string;
  status: string;
  userId: string;
  workspaceId?: string;
  tasks?: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  status: 'ACTIVE' | 'REMOVED';
  joinedAt?: string;
  user: User;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'GUEST';
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  invitedBy?: User;
  workspace?: { id: string; name: string };
  createdAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  currentUserRole?: string;
  memberCount?: number;
  members?: WorkspaceMember[];
  projects?: Project[];
  boards?: Board[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export type ColorMode = 'black' | 'blue' | 'amber' | 'emerald' | 'rose' | 'pink';

export interface VisibleFields {
  priority: boolean;
  members: boolean;
  dueDate: boolean;
  labels: boolean;
  status: boolean;
  reporter: boolean;
}

export interface FilterState {
  status: string[];
  priority: string[];
  members: string[];
  labels: string[];
  team: string[];
}
