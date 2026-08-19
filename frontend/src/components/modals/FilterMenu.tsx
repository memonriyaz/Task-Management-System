'use client';

import React, { useRef, useEffect } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { FilterState } from '../../types';
import { X, Check, Filter } from 'lucide-react';
import { clsx } from 'clsx';

interface FilterMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilterMenu: React.FC<FilterMenuProps> = ({ isOpen, onClose }) => {
  const { activeBoard, activeWorkspace, filters, toggleFilter, clearFilters } = useBoard();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const statusOptions = activeBoard?.columns?.map((c) => c.name) || ['To Do', 'Doing', 'Completed', 'On Hold'];
  const priorityOptions = ['Urgent', 'High', 'Medium', 'Low', 'No Priority'];

  const memberSet = new Set<string>();
  if (activeWorkspace?.members) {
    activeWorkspace.members.forEach((m) => {
      if (m.user?.name) memberSet.add(m.user.name);
      else if (m.user?.username) memberSet.add(m.user.username);
    });
  }
  activeBoard?.columns?.forEach((col) => {
    col.tasks?.forEach((t) => {
      if (t.assigneeName && t.assigneeName.trim()) memberSet.add(t.assigneeName.trim());
    });
  });
  const memberOptions = Array.from(memberSet);

  const labelSet = new Set<string>();
  activeBoard?.columns?.forEach((col) => {
    col.tasks?.forEach((t) => {
      if (t.labels) {
        t.labels.split(',').forEach((l) => {
          const trimmed = l.trim();
          if (trimmed) labelSet.add(trimmed);
        });
      }
    });
  });
  const labelOptions = Array.from(labelSet);

  const teamSet = new Set<string>();
  activeBoard?.columns?.forEach((col) => {
    col.tasks?.forEach((t) => {
      if (t.team && t.team.trim()) teamSet.add(t.team.trim());
    });
  });
  const teamOptions = Array.from(teamSet);

  const totalActive =
    filters.status.length +
    filters.priority.length +
    filters.members.length +
    filters.labels.length +
    filters.team.length;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-11 w-72 bg-white dark:bg-[#1E1E20] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 select-none max-h-[85vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-500" />
          <span className="font-bold text-[14px] text-gray-900 dark:text-white">
            Filter Tasks
          </span>
          {totalActive > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
              {totalActive}
            </span>
          )}
        </div>
        {totalActive > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 pt-3">

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Status
          </span>
          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map((st) => {
              const isSelected = filters.status.includes(st);
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => toggleFilter('status', st)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1',
                    isSelected
                      ? 'bg-black dark:bg-white text-white dark:text-black font-semibold'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                  )}
                >
                  {isSelected && <Check size={11} className="stroke-[3]" />}
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Priority
          </span>
          <div className="flex flex-wrap gap-1.5">
            {priorityOptions.map((pr) => {
              const isSelected = filters.priority.includes(pr);
              return (
                <button
                  key={pr}
                  type="button"
                  onClick={() => toggleFilter('priority', pr)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1',
                    isSelected
                      ? 'bg-black dark:bg-white text-white dark:text-black font-semibold'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                  )}
                >
                  {isSelected && <Check size={11} className="stroke-[3]" />}
                  <span>{pr}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Members
          </span>
          <div className="flex flex-wrap gap-1.5">
            {memberOptions.map((mb) => {
              const isSelected = filters.members.includes(mb);
              return (
                <button
                  key={mb}
                  type="button"
                  onClick={() => toggleFilter('members', mb)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1',
                    isSelected
                      ? 'bg-black dark:bg-white text-white dark:text-black font-semibold'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                  )}
                >
                  {isSelected && <Check size={11} className="stroke-[3]" />}
                  <span>{mb}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Labels
          </span>
          <div className="flex flex-wrap gap-1.5">
            {labelOptions.map((lb) => {
              const isSelected = filters.labels.includes(lb);
              return (
                <button
                  key={lb}
                  type="button"
                  onClick={() => toggleFilter('labels', lb)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1',
                    isSelected
                      ? 'bg-black dark:bg-white text-white dark:text-black font-semibold'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                  )}
                >
                  {isSelected && <Check size={11} className="stroke-[3]" />}
                  <span>{lb}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
