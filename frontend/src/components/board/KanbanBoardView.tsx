'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import { Task, Column } from '../../types';
import {
  GripVertical,
  Plus,
  MoreHorizontal,
  Calendar,
  Tag,
  Signal,
  CheckCircle2,
  Trash2,
  Copy,
  ArrowRight,
  Eye,
  Edit2,
  Check,
  Zap,
  FolderKanban,
  User,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const KanbanBoardView: React.FC = () => {
  const {
    activeBoard,
    isLoading,
    searchQuery,
    visibleFields,
    filters,
    moveTask,
    openTaskDetail,
    setCreateTaskModalOpen,
    setCreateTaskDefaultColumnId,
    reorderColumns,
    deleteColumn,
    updateColumn,
    deleteTask,
    activeTab,
    activeProjectId,
    selectedProject,
    selectProject,
  } = useBoard();

  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(null);

  const [activeColumnMenuId, setActiveColumnMenuId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');

  const [confirmDeleteColumn, setConfirmDeleteColumn] = useState<Column | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex gap-6 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-[300px] shrink-0 flex flex-col gap-4 animate-pulse">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            <div className="h-44 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
            <div className="h-44 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!activeBoard || !activeBoard.columns || activeBoard.columns.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
          <FolderKanban size={28} />
        </div>
        <h3 className="text-[17px] font-bold text-gray-900 dark:text-white mb-1">
          No Columns Found
        </h3>
        <p className="text-[13px] text-gray-500 max-w-sm mb-5">
          This workspace board does not have any active columns yet. Create your first task to get started.
        </p>
        <button
          type="button"
          onClick={() => setCreateTaskModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        >
          <Plus size={15} />
          <span>Create Task</span>
        </button>
      </div>
    );
  }

  const handleColumnDrop = async (targetColumnId: string) => {
    if (!draggingColumnId || draggingColumnId === targetColumnId) {
      setDraggingColumnId(null);
      setDragOverColumnIndex(null);
      return;
    }

    const currentCols = [...activeBoard.columns];
    const srcIdx = currentCols.findIndex((c) => c.id === draggingColumnId);
    const tgtIdx = currentCols.findIndex((c) => c.id === targetColumnId);

    if (srcIdx !== -1 && tgtIdx !== -1) {
      const [movedCol] = currentCols.splice(srcIdx, 1);
      currentCols.splice(tgtIdx, 0, movedCol);
      const newIds = currentCols.map((c) => c.id);
      await reorderColumns(activeBoard.id, newIds);
    }

    setDraggingColumnId(null);
    setDragOverColumnIndex(null);
  };

  const handleSaveColumnName = async (columnId: string) => {
    if (editingColumnName.trim()) {
      await updateColumn(columnId, editingColumnName.trim());
    }
    setEditingColumnId(null);
    setEditingColumnName('');
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 h-full flex flex-col bg-white dark:bg-[#121214] select-none font-sans">

      {activeTab === 'projects' && selectedProject && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50/80 dark:bg-[#18181A] border-b border-gray-200/80 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[14px]">
            <button
              type="button"
              onClick={() => selectProject(null)}
              className="text-gray-500 hover:text-black dark:hover:text-white font-medium transition-colors cursor-pointer"
            >
              Projects
            </button>
            <ChevronRight size={15} className="text-gray-400" />
            <span className="font-bold text-gray-900 dark:text-white">
              {selectedProject.name}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[12px]">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-medium">
              <Calendar size={13} className="text-gray-400" />
              <span>{selectedProject.dueDate || '12 Sep 2026'}</span>
            </div>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/40">
              <Signal size={12} className="stroke-[2.5]" />
              <span>{selectedProject.priority || 'High'}</span>
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 min-w-0 overflow-x-auto overflow-y-auto p-4 sm:p-6 flex gap-5">
        {activeBoard.columns.map((column, colIdx) => {

          if (filters.status.length > 0 && !filters.status.includes(column.name)) {
            return null;
          }

          const filteredTasks = column.tasks.filter((t) => {
            if (activeTab === 'projects' && activeProjectId) {
              if (t.projectId !== activeProjectId) return false;
            }

            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const matchSearch =
                t.title.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q)) ||
                (t.labels && t.labels.toLowerCase().includes(q));
              if (!matchSearch) return false;
            }

            if (filters.priority.length > 0 && !filters.priority.includes(t.priority)) {
              return false;
            }

            if (
              filters.members.length > 0 &&
              (!t.assigneeName || !filters.members.includes(t.assigneeName))
            ) {
              return false;
            }

            if (filters.labels.length > 0) {
              const taskLabels = t.labels
                ? t.labels.split(',').map((l) => l.trim())
                : [];
              const hasLabel = filters.labels.some((l) => taskLabels.includes(l));
              if (!hasLabel) return false;
            }

            if (filters.team.length > 0 && (!t.team || !filters.team.includes(t.team))) {
              return false;
            }

            return true;
          });

        const handleTaskDragOver = (e: React.DragEvent) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes('application/kanban-column')) {
            e.dataTransfer.dropEffect = 'move';
            if (dragOverColumnIndex !== colIdx) setDragOverColumnIndex(colIdx);
          } else {
            e.dataTransfer.dropEffect = 'move';
            if (dragOverColId !== column.id) setDragOverColId(column.id);
          }
        };

        const handleTaskDragLeave = (e: React.DragEvent) => {
          e.preventDefault();
          setDragOverColId(null);
        };

        const handleContainerDrop = async (e: React.DragEvent) => {
          e.preventDefault();
          setDragOverColId(null);

          if (e.dataTransfer.types.includes('application/kanban-column')) {
            await handleColumnDrop(column.id);
            return;
          }

          try {
            const dataStr = e.dataTransfer.getData('text/plain');
            if (!dataStr) return;
            const data = JSON.parse(dataStr);
            await moveTask(data.taskId, column.id, column.tasks.length, column.name);
          } catch (err) {
            console.error('Drop error:', err);
          }
        };

        const isDraggingThisColumn = draggingColumnId === column.id;
        const isDragOverThisColumn = dragOverColumnIndex === colIdx && draggingColumnId !== column.id;

        return (
          <div
            key={column.id}
            onDragOver={handleTaskDragOver}
            onDragLeave={handleTaskDragLeave}
            onDrop={handleContainerDrop}
            className={clsx(
              'w-[300px] shrink-0 flex flex-col h-full min-h-0 transition-all duration-150',
              isDraggingThisColumn && 'opacity-40 scale-[0.98]',
              isDragOverThisColumn && 'ring-2 ring-blue-500/80 rounded-2xl bg-blue-50/20 dark:bg-blue-950/20',
            )}
          >

            <div className="flex items-center justify-between pb-3 px-1 shrink-0 relative">
              <div className="flex items-center gap-1.5 min-w-0">

                <div
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDraggingColumnId(column.id);
                    e.dataTransfer.setData('application/kanban-column', column.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDraggingColumnId(null);
                    setDragOverColumnIndex(null);
                  }}
                  className="p-1 -ml-1 text-gray-400 hover:text-black dark:hover:text-white cursor-grab active:cursor-grabbing rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Drag the six dots to reorder this column"
                >
                  <GripVertical size={16} />
                </div>

                {editingColumnId === column.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveColumnName(column.id);
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      value={editingColumnName}
                      onChange={(e) => setEditingColumnName(e.target.value)}
                      onBlur={() => handleSaveColumnName(column.id)}
                      autoFocus
                      className="text-[13px] font-bold px-2 py-0.5 rounded-lg border border-blue-500 bg-transparent text-gray-900 dark:text-white focus:outline-none w-32"
                    />
                  </form>
                ) : (
                  <h2
                    onDoubleClick={() => {
                      setEditingColumnId(column.id);
                      setEditingColumnName(column.name);
                    }}
                    className="font-bold text-[14px] text-gray-800 dark:text-gray-200 truncate cursor-pointer hover:text-blue-600 transition-colors"
                    title="Double click to rename column"
                  >
                    {column.name} ({filteredTasks.length})
                  </h2>
                )}
              </div>

              <div className="flex items-center gap-1">

                <button
                  type="button"
                  onClick={() => {
                    setCreateTaskDefaultColumnId(column.id);
                    setCreateTaskModalOpen(true);
                  }}
                  className="p-1 rounded-lg text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Add Task to this column"
                >
                  <Plus size={16} />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveColumnMenuId(activeColumnMenuId === column.id ? null : column.id)
                    }
                    className="p-1 rounded-lg text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    title="Column Actions"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {activeColumnMenuId === column.id && (
                    <div
                      className="absolute right-0 top-8 w-48 bg-white dark:bg-[#1E1E20] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveColumnMenuId(null);
                          setEditingColumnId(column.id);
                          setEditingColumnName(column.name);
                        }}
                        className="w-full px-3 py-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Edit2 size={13} className="text-gray-400" />
                        <span>Rename Column</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveColumnMenuId(null);
                          setCreateTaskDefaultColumnId(column.id);
                          setCreateTaskModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Plus size={13} className="text-gray-400" />
                        <span>Add Task</span>
                      </button>

                      {activeBoard.columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveColumnMenuId(null);
                            setConfirmDeleteColumn(column);
                          }}
                          className="w-full px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                          <span>Delete Column</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className={clsx(
                'flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1.5 pb-12 flex flex-col gap-3 rounded-2xl transition-colors',
                dragOverColId === column.id && 'bg-gray-100/70 dark:bg-gray-800/40 p-2',
              )}
            >
              {filteredTasks.length > 0 ? (
                <>
                  {filteredTasks.map((task, idx) => (
                    <KanbanTaskCard
                      key={task.id}
                      task={task}
                      index={idx}
                      columns={activeBoard.columns}
                      onDeleteTask={(t) => setConfirmDeleteTask(t)}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setCreateTaskDefaultColumnId(column.id);
                      setCreateTaskModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 text-gray-500 hover:text-black dark:hover:text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Add Task</span>
                  </button>
                </>
              ) : (

                <div
                  onClick={() => {
                    setCreateTaskDefaultColumnId(column.id);
                    setCreateTaskModalOpen(true);
                  }}
                  className="w-full py-7 px-4 rounded-2xl border-2 border-dashed border-gray-200/90 dark:border-gray-800/80 flex flex-col items-center justify-center text-center gap-1.5 hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer group bg-gray-50/40 dark:bg-gray-800/20"
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                    <Plus size={16} />
                  </div>
                  <span className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    No tasks in {column.name}
                  </span>
                  <span className="text-[11px] text-gray-400">Click to create task</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteColumn}
        title={`Delete Column "${confirmDeleteColumn?.name}"?`}
        description="Are you sure you want to delete this column and all tasks within it? This action cannot be undone."
        confirmText="Delete Column"
        cancelText="Cancel"
        variant="danger"
        icon="delete"
        onConfirm={async () => {
          if (confirmDeleteColumn) {
            await deleteColumn(confirmDeleteColumn.id);
          }
          setConfirmDeleteColumn(null);
        }}
        onClose={() => setConfirmDeleteColumn(null)}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteTask}
        title={`Delete "${confirmDeleteTask?.title}"?`}
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="danger"
        icon="delete"
        onConfirm={async () => {
          if (confirmDeleteTask) {
            await deleteTask(confirmDeleteTask.id);
          }
          setConfirmDeleteTask(null);
        }}
        onClose={() => setConfirmDeleteTask(null)}
      />
    </div>
  );
};

interface KanbanTaskCardProps {
  task: Task;
  index: number;
  columns: Column[];
  onDeleteTask: (task: Task) => void;
}

const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({ task, index, columns, onDeleteTask }) => {
  const { openTaskDetail, visibleFields, updateTask, deleteTask, createTask, moveTask } = useBoard();
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isMoveSubmenuOpen, setIsMoveSubmenuOpen] = useState(false);
  const [isPrioritySubmenuOpen, setIsPrioritySubmenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsQuickMenuOpen(false);
        setIsMoveSubmenuOpen(false);
        setIsPrioritySubmenuOpen(false);
      }
    };
    if (isQuickMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuickMenuOpen]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        taskId: task.id,
        sourceColumnId: task.columnId,
        sourceIndex: index,
      }),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDuplicateTask = async () => {
    setIsQuickMenuOpen(false);
    await createTask({
      title: `${task.title} (Copy)`,
      description: task.description || '',
      columnId: task.columnId,
      projectId: task.projectId,
      workspaceId: task.workspaceId,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      labels: task.labels,
      assigneeName: task.assigneeName,
      assigneeAvatar: task.assigneeAvatar,
    });
  };

  const handleMoveToColumn = async (targetCol: Column) => {
    setIsQuickMenuOpen(false);
    await moveTask(task.id, targetCol.id, targetCol.tasks.length, targetCol.name);
  };

  const handleChangePriority = async (newPriority: string) => {
    setIsQuickMenuOpen(false);
    await updateTask(task.id, { priority: newPriority });
  };

  const handleDeleteTask = () => {
    setIsQuickMenuOpen(false);
    onDeleteTask(task);
  };

  const labelsArray = task.labels
    ? task.labels.split(',').map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => openTaskDetail(task.id)}
      className="bg-white dark:bg-[#1E1E20] p-4 rounded-2xl border border-gray-200/90 dark:border-gray-800 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer select-none group flex flex-col gap-3 relative"
    >

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[14px] leading-snug text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {task.title}
        </h3>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickMenuOpen(!isQuickMenuOpen);
            }}
            className="text-gray-400 hover:text-black dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Quick Actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {isQuickMenuOpen && (
            <div
              className="absolute right-0 top-7 w-52 bg-white dark:bg-[#1E1E20] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left font-sans"
              onClick={(e) => e.stopPropagation()}
            >

              <button
                type="button"
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  openTaskDetail(task.id);
                }}
                className="w-full px-3 py-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Eye size={14} className="text-gray-400" />
                <span>View / Edit Details</span>
              </button>

              <button
                type="button"
                onClick={handleDuplicateTask}
                className="w-full px-3 py-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Copy size={14} className="text-gray-400" />
                <span>Duplicate Task</span>
              </button>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Move To
              </div>
              <div className="flex flex-col gap-0.5">
                {columns.map((col) => {
                  const isCurrentCol = col.id === task.columnId;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      disabled={isCurrentCol}
                      onClick={() => handleMoveToColumn(col)}
                      className={clsx(
                        'w-full px-3 py-1.5 text-[12px] font-medium rounded-lg flex items-center justify-between transition-colors',
                        isCurrentCol
                          ? 'text-gray-400 bg-gray-50 dark:bg-gray-800/40 cursor-default font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer',
                      )}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: col.color || '#49C4E5' }}
                        />
                        <span className="truncate">{col.name}</span>
                      </div>
                      {isCurrentCol && <Check size={12} className="text-blue-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Priority
              </div>
              <div className="grid grid-cols-2 gap-1 px-1">
                {['Urgent', 'High', 'Medium', 'Low'].map((p) => {
                  const isCurrentPriority = task.priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleChangePriority(p)}
                      className={clsx(
                        'py-1 px-2 text-[11px] font-semibold rounded-lg text-center transition-colors cursor-pointer',
                        isCurrentPriority
                          ? 'bg-black dark:bg-white text-white dark:text-black font-bold'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

              <button
                type="button"
                onClick={handleDeleteTask}
                className="w-full px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Task</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {(visibleFields.priority || visibleFields.status) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleFields.priority && task.priority && (
            <span
              className={clsx(
                'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
                task.priority === 'Urgent' && 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50',
                task.priority === 'High' && 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
                task.priority === 'Medium' && 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
                task.priority === 'Low' && 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
                task.priority === 'No Priority' && 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
              )}
            >
              <Signal size={11} className="stroke-[2.5]" />
              <span>{task.priority}</span>
            </span>
          )}

          {visibleFields.status && task.status && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-medium border border-gray-200/60 dark:border-gray-700/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{task.status}</span>
            </span>
          )}
        </div>
      )}

      {(visibleFields.members || visibleFields.dueDate) && (
        <div className="flex items-center justify-between gap-2 text-[12px]">
          {visibleFields.members && (
            task.taskMembers && task.taskMembers.length > 0 ? (
              task.taskMembers.length === 1 ? (
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 min-w-0">
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-[9px] shrink-0">
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
                  <span className="font-medium text-[12px] truncate">
                    {task.taskMembers[0].user?.name || task.taskMembers[0].user?.username || 'Member'}
                  </span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 min-w-0"
                  title={task.taskMembers.map((tm) => tm.user?.name || tm.user?.username).join(', ')}
                >
                  <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                    {task.taskMembers.slice(0, 3).map((tm) => (
                      <div
                        key={tm.id || tm.userId}
                        className="w-5 h-5 rounded-full overflow-hidden border border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-[8px]"
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
                    {task.taskMembers.length > 3 && (
                      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 border border-white dark:border-gray-800 flex items-center justify-center font-bold text-[8px] text-gray-600 dark:text-gray-300">
                        +{task.taskMembers.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-[11px] text-gray-500 dark:text-gray-400">
                    {task.taskMembers.length} members
                  </span>
                </div>
              )
            ) : task.assigneeName && task.assigneeName !== 'Unassigned' ? (
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 min-w-0">
                <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                  {task.assigneeAvatar ? (
                    <img
                      src={task.assigneeAvatar}
                      alt="Assignee"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(task.assigneeName || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="font-medium text-[12px] truncate">
                  {task.assigneeName}
                </span>
              </div>
            ) : (
              <div className="text-[12px] text-gray-400 font-medium">Unassigned</div>
            )
          )}

          {visibleFields.dueDate && task.dueDate && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-medium text-[11px] shrink-0 ml-auto">
              <Calendar size={12} />
              <span>{task.dueDate}</span>
            </div>
          )}
        </div>
      )}

      {visibleFields.reporter && task.reporter && task.reporter !== 'Unassigned' && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          <User size={12} className="text-gray-400 shrink-0" />
          <span className="truncate">Reporter: {task.reporter}</span>
        </div>
      )}

      {visibleFields.labels && labelsArray.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          {labelsArray.map((label, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-medium"
            >
              <Tag size={11} className="text-gray-400" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
