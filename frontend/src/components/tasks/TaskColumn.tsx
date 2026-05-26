import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskCard } from '@/components/tasks/TaskCard';
import type { Task, TaskStatus } from '@/types/tasks';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  isLoading?: boolean;
  onSelect: (task: Task) => void;
}

export function TaskColumn({ status, tasks, isLoading, onSelect }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className="rounded-2xl border border-border/50 bg-[var(--surface-muted)] p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={statusDotClass(status)} />
            <h2 className="text-sm font-semibold text-foreground">{status}</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{tasks.length} tasks</p>
        </div>
        <Badge variant="muted" className="text-[10px]">
          {status}
        </Badge>
      </div>

      <SortableContext items={tasks.map((task) => task.taskId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-24" />
            </>
          ) : tasks.length ? (
            tasks.map((task) => <TaskCard key={task.taskId} task={task} onSelect={onSelect} />)
          ) : (
            <div className="rounded-xl border border-dashed border-border/50 bg-[var(--surface)] p-4 text-xs text-muted-foreground">
              No tasks here yet.
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function statusDotClass(status: TaskStatus) {
  if (status === 'In Progress') return 'h-2.5 w-2.5 rounded-full bg-primary';
  if (status === 'In Review') return 'h-2.5 w-2.5 rounded-full bg-secondary';
  if (status === 'Done') return 'h-2.5 w-2.5 rounded-full bg-primary/60';
  return 'h-2.5 w-2.5 rounded-full bg-muted-foreground/60';
}
