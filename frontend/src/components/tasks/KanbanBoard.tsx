import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { updateTaskStatus } from '@/api/tasks';

interface Task {
  taskId: string;
  title: string;
  status: string;
  assigneeName?: string;
  teamId: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const columns = ['To Do', 'In Progress', 'In Review', 'Done'];

export function KanbanBoard({ tasks, setTasks }: KanbanBoardProps) {
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = columns[destination.droppableId];
    try {
      await updateTaskStatus(draggableId, newStatus);
      setTasks(prev =>
        prev.map(task =>
          task.taskId === draggableId ? { ...task, status: newStatus } : task
        )
      );
      toast.success('Task moved');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kanban Board</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {columns.map((col, idx) => (
            <Droppable key={col} droppableId={idx.toString()}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-100 p-3 rounded min-h-[200px]">
                  <h2 className="font-semibold mb-2">{col}</h2>
                  {getTasksByStatus(col).map((task, index) => (
                    <Draggable key={task.taskId} draggableId={task.taskId} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-2">
                          <Card>
                            <CardContent className="p-3">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-gray-500">{task.assigneeName}</p>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}