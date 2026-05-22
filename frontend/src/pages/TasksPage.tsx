import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskCardPreview } from '@/components/tasks/TaskCard';
import { TaskColumn } from '@/components/tasks/TaskColumn';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, useTaskMutations } from '@/hooks/useTasks';
import { toast } from '@/hooks/use-toast';
import type { Task, TaskStatus } from '@/types/tasks';
import { normalizeRole } from '@/lib/auth-utils';

const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];

export function TasksPage() {
  const { session } = useAuth();
  const role = normalizeRole(session?.role ?? '');
  const isManager = role === 'manager';
  const { data, isLoading, error } = useTasks();
  const { createMutation, updateMutation, deleteMutation } = useTaskMutations();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const tasks = data?.tasks ?? [];
  const columns = useMemo(
    () =>
      STATUSES.reduce<Record<TaskStatus, Task[]>>(
        (acc, status) => {
          acc[status] = tasks.filter((task) => (task.status || 'To Do') === status);
          return acc;
        },
        {
          'To Do': [],
          'In Progress': [],
          'In Review': [],
          Done: []
        }
      ),
    [tasks]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeTaskItem = tasks.find((task) => task.taskId === active.id);
    if (!activeTaskItem) return;

    const overTask = tasks.find((task) => task.taskId === over.id);
    const nextStatus = overTask ? (overTask.status || 'To Do') : (over.id as TaskStatus);
    const currentStatus = activeTaskItem.status || 'To Do';

    if (nextStatus === currentStatus) return;

    updateMutation.mutate(
      { taskId: activeTaskItem.taskId, payload: { status: nextStatus } },
      {
        onSuccess: () => {
          toast({ title: 'Status updated', description: `Moved to ${nextStatus}.` });
        },
        onError: (mutationError: Error) => {
          toast({
            variant: 'destructive',
            title: 'Status update failed',
            description: mutationError.message
          });
        }
      }
    );
  };

  const handleCreate = (payload: Task) => {
    createMutation.mutate(
      {
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        deadline: payload.deadline,
        assigneeId: payload.assigneeId,
        teamId: payload.teamId,
        imageKey: payload.imageKey
      },
      {
        onSuccess: () => {
          toast({ title: 'Task created', description: 'Your new task is ready.' });
          setCreateOpen(false);
        },
        onError: (mutationError: Error) => {
          toast({
            variant: 'destructive',
            title: 'Task creation failed',
            description: mutationError.message
          });
        }
      }
    );
  };

  const handleUpdate = (taskId: string, payload: Partial<Task>) => {
    updateMutation.mutate(
      { taskId, payload },
      {
        onSuccess: () => {
          toast({ title: 'Task updated', description: 'Changes saved successfully.' });
        },
        onError: (mutationError: Error) => {
          toast({
            variant: 'destructive',
            title: 'Update failed',
            description: mutationError.message
          });
        }
      }
    );
  };

  const handleDelete = (taskId: string) => {
    deleteMutation.mutate(taskId, {
      onSuccess: () => {
        toast({ title: 'Task deleted', description: 'The task was removed.' });
        setSelectedTask(null);
      },
      onError: (mutationError: Error) => {
        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: mutationError.message
        });
      }
    });
  };

  return (
    <AppShell
      title="Tasks"
      subtitle="Manage team delivery with live status updates."
      actions={
        isManager ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        ) : null
      }
    >
      {error ? (
        <div className="rounded-2xl border border-border/50 bg-[var(--surface)] p-6 text-sm text-red-600">
          {(error as Error).message}
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/50 bg-[var(--surface)] p-5 shadow-card">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Kanban</p>
              <h2 className="mt-2 text-lg font-semibold text-foreground">Delivery board</h2>
              <p className="text-sm text-muted-foreground">Drag tasks between columns to update status instantly.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUSES.map((status) => (
                <Badge key={status} variant="muted" className="text-[10px]">
                  {status}
                </Badge>
              ))}
              <Button variant="outline" className="h-9 px-3 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </Button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={({ active }) => {
              const found = tasks.find((task) => task.taskId === active.id);
              setActiveTask(found ?? null);
            }}
          >
            <div className="grid gap-6 lg:grid-cols-4">
              {STATUSES.map((status) => (
                <SortableContext
                  key={status}
                  items={columns[status].map((task) => task.taskId)}
                  strategy={verticalListSortingStrategy}
                >
                  <TaskColumn
                    status={status}
                    tasks={columns[status]}
                    isLoading={isLoading}
                    onSelect={setSelectedTask}
                  />
                </SortableContext>
              ))}
            </div>

            {createPortal(
              <DragOverlay>
                {activeTask ? <TaskCardPreview task={activeTask} /> : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`loading-${index}`} className="h-28" />
          ))}
        </div>
      ) : null}

      <TaskDialog
        open={createOpen}
        mode="create"
        isManager={isManager}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        defaultAssigneeId={session?.user?.userId}
        defaultTeamId={session?.teamId ?? ''}
      />

      <TaskDialog
        open={Boolean(selectedTask)}
        mode="edit"
        task={selectedTask}
        isManager={isManager}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
        onSubmit={(payload) => {
          if (!selectedTask) return;
          handleUpdate(selectedTask.taskId, payload);
        }}
        onDelete={(taskId) => handleDelete(taskId)}
        isSubmitting={updateMutation.isPending || deleteMutation.isPending}
      />
    </AppShell>
  );
}
