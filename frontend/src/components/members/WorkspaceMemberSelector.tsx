'use client';

import React, { useState } from 'react';
import { useWorkspaceMembers } from '../../hooks/useWorkspace';
import { Search, Check, UserPlus, X, Loader2, AlertCircle } from 'lucide-react';
import { useBoard } from '../../contexts/BoardContext';

interface WorkspaceMemberSelectorProps {
  workspaceId: string;
  assignedUserIds: string[];
  onSelectMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  onClose?: () => void;
}

export const WorkspaceMemberSelector: React.FC<WorkspaceMemberSelectorProps> = ({
  workspaceId,
  assignedUserIds,
  onSelectMember,
  onRemoveMember,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const { setInviteModalOpen } = useBoard();
  const { data: members, isLoading, isError } = useWorkspaceMembers(workspaceId, search);

  const handleToggleMember = (userId: string) => {
    if (assignedUserIds.includes(userId)) {
      onRemoveMember(userId);
    } else {
      onSelectMember(userId);
    }
  };

  return (
    <div className="w-full max-w-[320px] bg-white dark:bg-[#1E1E20] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/80 p-3 flex flex-col gap-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">

      <div className="flex items-center justify-between px-1">
        <span className="text-[13px] font-bold text-gray-900 dark:text-white">
          Workspace Members
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <Search size={14} className="absolute left-2.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[12px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="max-h-[220px] overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
        {isLoading && (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-gray-400 text-[12px]">
            <Loader2 size={18} className="animate-spin text-gray-500" />
            <span>Loading members...</span>
          </div>
        )}

        {isError && (
          <div className="py-4 px-2 flex items-center gap-2 text-red-500 text-[12px]">
            <AlertCircle size={15} className="shrink-0" />
            <span>Unable to load workspace members.</span>
          </div>
        )}

        {!isLoading && !isError && members && members.length === 0 && (
          <div className="py-6 text-center text-gray-400 text-[12px]">
            {search ? `No members match "${search}".` : 'No members found.'}
          </div>
        )}

        {!isLoading &&
          !isError &&
          members &&
          members.map((m) => {
            const isAssigned = assignedUserIds.includes(m.user.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleToggleMember(m.user.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                  isAssigned
                    ? 'bg-gray-100/80 dark:bg-gray-800/80 font-medium'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-[11px] text-gray-700 dark:text-gray-200">
                    {m.user.avatar ? (
                      <img
                        src={m.user.avatar}
                        alt={m.user.name || 'Member'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(m.user.name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] text-gray-900 dark:text-white truncate">
                      {m.user.name || m.user.username || 'Member'}
                    </span>
                    {m.user.email && (
                      <span className="text-[10px] text-gray-400 truncate">
                        {m.user.email}
                      </span>
                    )}
                  </div>
                </div>

                {isAssigned && (
                  <div className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
      </div>

      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            setInviteModalOpen(true);
          }}
          className="w-full py-2 px-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40 text-[12px] font-medium flex items-center justify-center gap-2 transition-all"
        >
          <UserPlus size={14} className="text-gray-500" />
          <span>Invite someone to workspace</span>
        </button>
      </div>
    </div>
  );
};
