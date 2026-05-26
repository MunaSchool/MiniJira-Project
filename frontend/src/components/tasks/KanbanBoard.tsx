import { closestCorners, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskColumn } from '@/components/tasks/TaskColumn';
import { useAuth } from '@/hooks/useAuth';
import { useTaskMutations, useTasks } from '@/hooks/useTasks';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { toast } from '@/hooks/use-toast';
import { normalizeRole } from '@/lib/auth-utils';
import type { Task, TaskStatus } from '@/types/tasks';

const BOARD_COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];

export function KanbanBoard() {
  const { session } = useAuth();
  const { data, isLoading, error } = useTasks();
  const { updateMutation, createMutation, deleteMutation } = useTaskMutations();
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasks = data?.tasks ?? [];
  const role = normalizeRole(session?.role ?? '') ?? 'employee';
  const isManager = role === 'manager';

  const orderedTasks = useMemo(() => {
    if (!localOrder.length) {
      return tasks;
    }

    const taskMap = new Map(tasks.map((task) => [task.taskId, task]));
    const ordered = localOrder.map((taskId) => taskMap.get(taskId)).filter(Boolean) as Task[];
    const remaining = tasks.filter((task) => !localOrder.includes(task.taskId));
    return [...ordered, ...remaining];
  }, [localOrder, tasks]);

  const tasksByStatus = useMemo(() => {
    return BOARD_COLUMNS.reduce<Record<TaskStatus, Task[]>>((accumulator, status) => {
      accumulator[status] = orderedTasks.filter((task) => (task.status ?? 'To Do') === status);
      return accumulator;
    }, {
      'To Do': [],
      'In Progress': [],
      'In Review': [],
      Done: []
    });
  }, [orderedTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeTask = tasks.find((task) => task.taskId === active.id);
    if (!activeTask) {
      return;
    }

    const targetTask = tasks.find((task) => task.taskId === over.id);
    const targetStatus = (BOARD_COLUMNS.includes(over.id as TaskStatus)
      ? over.id
      : targetTask?.status) as TaskStatus | undefined;

    if (!targetStatus) {
      return;
    }

    if (targetStatus !== activeTask.status) {
      updateMutation.mutate({
        taskId: activeTask.taskId,
        payload: { status: targetStatus }
      });
    }

    setLocalOrder((current) => {
      const next = current.filter((taskId) => taskId !== activeTask.taskId);
      const overIndex = next.indexOf(String(over.id));
      if (overIndex >= 0) {
        next.splice(overIndex, 0, activeTask.taskId);
      } else {
        next.push(activeTask.taskId);
      }
      return next;
    });
  };

  return (
    <AppShell
      title="Tasks"
      subtitle="Track work across To Do, In Progress, In Review, and Done."
      actions={
        <>
          <Button disabled={!isManager} onClick={() => setOpenCreate(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
          <TaskDialog
            open={openCreate}
            mode="create"
            isManager={isManager}
            onOpenChange={(open) => setOpenCreate(open)}
            onSubmit={(payload) => {
              setCreating(true);
              createMutation.mutate(payload as any, {
                onSuccess: () => {
                  setCreating(false);
                  setOpenCreate(false);
                  toast({ title: 'Task created', description: 'The task was created successfully.' });
                },
                onError: (err: unknown) => {
                  setCreating(false);
                  toast({ title: 'Create failed', description: err instanceof Error ? err.message : String(err) });
                }
              });
            }}
            isSubmitting={creating || createMutation.isPending}
            defaultAssigneeId={session?.user?.userId}
            defaultTeamId={session?.teamId ?? undefined}
          />
          <TaskDialog
            open={Boolean(selectedTask)}
            mode="edit"
            task={selectedTask}
            isManager={isManager}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedTask(null);
              }
            }}
            onSubmit={(payload) => {
              if (!selectedTask) return;

              updateMutation.mutate(
                { taskId: selectedTask.taskId, payload: payload as any },
                {
                  onSuccess: () => {
                    setSelectedTask(null);
                    toast({ title: 'Task updated', description: 'Task details were saved.' });
                  },
                  onError: (err: unknown) => {
                    toast({ title: 'Update failed', description: err instanceof Error ? err.message : String(err) });
                  }
                }
              );
            }}
            onDelete={
              isManager
                ? (taskId) => {
                    deleteMutation.mutate(taskId, {
                      onSuccess: () => {
                        setSelectedTask(null);
                        toast({ title: 'Task removed', description: 'The task was deleted.' });
                      },
                      onError: (err: unknown) => {
                        toast({ title: 'Delete failed', description: err instanceof Error ? err.message : String(err) });
                      }
                    });
                  }
                : undefined
            }
            isSubmitting={updateMutation.isPending}
          />
        </>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-border/50 bg-[var(--surface)] p-6 text-sm text-red-600">
          {(error as Error).message}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryChip label="To Do" value={tasksByStatus['To Do'].length} loading={isLoading} />
            <SummaryChip label="In Progress" value={tasksByStatus['In Progress'].length} loading={isLoading} />
            <SummaryChip label="In Review" value={tasksByStatus['In Review'].length} loading={isLoading} />
            <SummaryChip label="Done" value={tasksByStatus.Done.length} loading={isLoading} />
          </div>

          <div className="grid gap-3 xl:grid-cols-4">
            {BOARD_COLUMNS.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                isLoading={isLoading}
                onSelect={(task) => setSelectedTask(task)}
              />
            ))}
          </div>
        </DndContext>
      )}
    </AppShell>
  );
}

function SummaryChip({ label, value, loading }: { label: string; value: number; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-border/50 bg-[var(--surface)] p-3 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-16" />
      ) : (
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      )}
    </div>
  );
}
