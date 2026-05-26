import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types/tasks';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onSelect?: (task: Task) => void;
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.taskId
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={cn(
        'rounded-2xl border border-border/50 bg-[var(--surface)] p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover',
        isDragging && 'opacity-60'
      )}
      onClick={() => onSelect?.(task)}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
        {task.priority ? (
          <Badge variant="secondary" className={priorityClass(task.priority)}>
            {task.priority}
          </Badge>
        ) : null}
      </div>
      {task.description ? (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {task.deadline ? (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(task.deadline)}
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <Paperclip className="h-3.5 w-3.5" />
          {task.imageKey ? '1 attachment' : 'No attachments'}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {task.commentCount ?? 0} comments
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Assignee</span>
        <span className="font-semibold text-foreground">{task.assigneeName || task.assigneeEmail || task.assigneeId || '-'}</span>
      </div>
    </motion.div>
  );
}

export function TaskCardPreview({ task }: { task: Task }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-[var(--surface)] p-4 shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
        {task.priority ? (
          <Badge variant="secondary" className={priorityClass(task.priority)}>
            {task.priority}
          </Badge>
        ) : null}
      </div>
      {task.description ? (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {task.deadline ? (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(task.deadline)}
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <Paperclip className="h-3.5 w-3.5" />
          {task.imageKey ? '1 attachment' : 'No attachments'}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {task.commentCount ?? 0} comments
        </span>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function priorityClass(priority: string) {
  const normalized = priority.toLowerCase();
  if (normalized.includes('high') || normalized.includes('urgent')) {
    return 'bg-accent/70 text-accent-foreground';
  }
  if (normalized.includes('medium')) {
    return 'bg-secondary-muted text-foreground';
  }
  return 'bg-muted text-muted-foreground';
}
