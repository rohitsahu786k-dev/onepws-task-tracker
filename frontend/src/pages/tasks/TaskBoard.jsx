import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useAuthStore from '../../store/authStore';
import * as taskService from '../../services/task.service';
import toast from 'react-hot-toast';

// Simple Board Column Setup
const COLUMNS = [
  { id: 'open', title: 'Open', color: 'border-slate-200 bg-slate-50' },
  { id: 'in_progress', title: 'In Progress', color: 'border-blue-200 bg-blue-50' },
  { id: 'waiting_for_feedback', title: 'Waiting Feedback', color: 'border-amber-200 bg-amber-50' },
  { id: 'closed', title: 'Closed', color: 'border-green-200 bg-green-50' },
];

const TaskBoard = () => {
  const { workspace } = useAuthStore();
  const queryClient = useQueryClient();
  const workspaceId = workspace?._id || 'mock-workspace-id';

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', workspaceId],
    queryFn: () => taskService.getTasks(workspaceId),
    enabled: !!workspaceId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => taskService.updateTaskStatus(workspaceId, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', workspaceId]);
    },
    onError: () => {
      toast.error('Failed to update task status');
      queryClient.invalidateQueries(['tasks', workspaceId]); // Revert optimistic UI
    }
  });

  const tasksByColumn = useMemo(() => {
    const grouped = { open: [], in_progress: [], waiting_for_feedback: [], closed: [] };
    if (!data?.data) return grouped;
    
    data.data.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        // Fallback for unmapped statuses
        grouped.open.push(task);
      }
    });
    return grouped;
  }, [data]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    // Optimistic Update can be added here
    updateStatusMutation.mutate({ taskId: draggableId, status: newStatus });
  };

  if (isLoading) return <div className="p-8">Loading Board...</div>;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Task Board</h1>
        <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm font-medium">
          + Create Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="w-80 flex flex-col shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">{col.title}</h3>
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-1 rounded-full">
                  {tasksByColumn[col.id]?.length || 0}
                </span>
              </div>
              
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 rounded-xl border p-2 ${col.color} dark:bg-slate-900 dark:border-slate-800 ${snapshot.isDraggingOver ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    {tasksByColumn[col.id]?.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 p-4 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-sm hover:shadow transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/50' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-semibold text-primary">{task.taskNumber}</span>
                              {task.isOverdue && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Overdue</span>}
                            </div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">{task.title}</h4>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex -space-x-2">
                                {task.assignedTo?.slice(0, 3).map((user, i) => (
                                  <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                    {user.name?.charAt(0) || '?'}
                                  </div>
                                ))}
                              </div>
                              {task.dueDate && (
                                <span className="text-xs text-slate-500">
                                  {new Date(task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskBoard;
