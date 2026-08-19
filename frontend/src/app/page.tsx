'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBoard } from '../contexts/BoardContext';
import { AuthScreen } from '../components/auth/AuthScreen';
import { WorkspaceSidebar } from '../components/layout/WorkspaceSidebar';
import { TasksHeader } from '../components/layout/TasksHeader';
import { KanbanBoardView } from '../components/board/KanbanBoardView';
import { ListView } from '../components/list/ListView';
import { TaskDetailView } from '../components/detail/TaskDetailView';
import { ProjectsView } from '../components/projects/ProjectsView';
import { ProjectDetailView } from '../components/projects/ProjectDetailView';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';
import { CreateProjectModal } from '../components/modals/CreateProjectModal';
import { ProfileModal } from '../components/profile/ProfileModal';
import { InviteMemberModal } from '../components/modals/InviteMemberModal';
import { CreateWorkspaceModal } from '../components/modals/CreateWorkspaceModal';
import { WorkspaceSettingsModal } from '../components/modals/WorkspaceSettingsModal';

export default function App() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const {
    viewMode,
    selectedDetailTaskId,
    activeTab,
    activeProjectId,
  } = useBoard();

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-[#121214]">
        <div className="w-8 h-8 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#121214] font-sans antialiased text-gray-900 dark:text-gray-100">

      <WorkspaceSidebar />

      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-white dark:bg-[#121214]">

        {selectedDetailTaskId ? (
          <TaskDetailView />
        ) : (
          <>

            <TasksHeader />

            {activeTab === 'projects' ? (
              activeProjectId ? (
                viewMode === 'board' ? (
                  <KanbanBoardView />
                ) : (
                  <ProjectDetailView />
                )
              ) : (
                <ProjectsView />
              )
            ) : viewMode === 'board' ? (
              <KanbanBoardView />
            ) : (
              <ListView />
            )}
          </>
        )}
      </div>

      <CreateTaskModal />
      <CreateProjectModal />
      <ProfileModal />
      <WorkspaceSettingsModal />
      <CreateWorkspaceModal />
      <InviteMemberModal />
    </div>
  );
}
