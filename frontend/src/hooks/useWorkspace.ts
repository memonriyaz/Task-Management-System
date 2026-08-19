'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Workspace, WorkspaceMember, User, WorkspaceInvitation } from '../types';

export const useWorkspaces = () => {
  const [data, setData] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getWorkspaces();
      setData(res);
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return { data, isLoading, isError, refetch: fetchWorkspaces };
};

export const useWorkspace = (workspaceId?: string) => {
  const [data, setData] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(!!workspaceId);
  const [isError, setIsError] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      const res = await api.getWorkspace(workspaceId);
      setData(res);
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  return { data, isLoading, isError, refetch: fetchWorkspace };
};

export const useWorkspaceMembers = (workspaceId?: string, search?: string) => {
  const [data, setData] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(!!workspaceId);
  const [isError, setIsError] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      const res = await api.getWorkspaceMembers(workspaceId, search);
      setData(res);
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, search]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { data, isLoading, isError, refetch: fetchMembers };
};

export const useTaskMembers = (taskId?: string) => {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(!!taskId);
  const [isError, setIsError] = useState(false);

  const fetchTaskMembers = useCallback(async () => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      const res = await api.getTaskMembers(taskId);
      setData(res);
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTaskMembers();
  }, [fetchTaskMembers]);

  return { data, isLoading, isError, refetch: fetchTaskMembers };
};

export const useAssignTaskMember = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({ taskId, userId }: { taskId: string; userId: string }) => {
    try {
      setIsPending(true);
      const res = await api.assignTaskMember(taskId, userId);
      return res;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
};

export const useRemoveTaskMember = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({ taskId, userId }: { taskId: string; userId: string }) => {
    try {
      setIsPending(true);
      const res = await api.removeTaskMember(taskId, userId);
      return res;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
};

export const useInviteWorkspaceMember = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({
    workspaceId,
    email,
    role,
  }: {
    workspaceId: string;
    email: string;
    role?: string;
  }) => {
    try {
      setIsPending(true);
      const res = await api.createWorkspaceInvitation(workspaceId, { email, role });
      return res;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
};

export const useWorkspaceInvitations = (workspaceId?: string) => {
  const [data, setData] = useState<WorkspaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(!!workspaceId);
  const [isError, setIsError] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      const res = await api.getWorkspaceInvitations(workspaceId);
      setData(res);
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return { data, isLoading, isError, refetch: fetchInvitations };
};

export const useAcceptInvitation = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (token: string) => {
    try {
      setIsPending(true);
      const res = await api.acceptInvitation(token);
      return res;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
};
