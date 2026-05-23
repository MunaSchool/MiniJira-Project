import { useState } from 'react';
import type { Task, TaskStatus } from '@/types/tasks';
import { updateTaskStatus, deleteTask } from '@/services/tasks.service';
import { CommentsSection } from './CommentsSection';
import { toast } from 'sonner';
import { teamLabel, type TeamOption } from '@/lib/teams';

const ALL_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];

interface TaskBoardCardProps {
  task: Task;
  isManager: boolean;
  teams: TeamOption[];
  assigneeNames: Record<string, string>;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskBoardCard({
  task,
  isManager,
  teams,
  assigneeNames,
  onUpdated,
  onDeleted
}: TaskBoardCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const otherStatuses = ALL_STATUSES.filter((s) => s !== task.status);

  const moveTo = async (status: TaskStatus) => {
    setBusy(true);
    try {
      const updated = await updateTaskStatus(task.taskId, status);
      onUpdated({ ...task, ...updated, status });
      toast.success(`Moved to ${status}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!isManager || !window.confirm('Delete this task?')) return;
    setBusy(true);
    try {
      await deleteTask(task.taskId);
      onDeleted(task.taskId);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setBusy(false);
    }
  };

  const assignee = assigneeNames[task.assigneeId] || task.assigneeName || task.assigneeId;
  const team = teamLabel(task.teamId, teams);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-900">{task.title}</h3>
      {task.description ? <p className="mt-1 text-sm text-slate-600">{task.description}</p> : null}
      {task.imageUrl ? (
        <img
          src={task.resizedImageUrl || task.imageUrl}
          alt=""
          className="mt-2 max-h-32 w-full rounded object-cover"
        />
      ) : null}
      <p className="mt-2 text-xs text-slate-500">
        Team: {team} – {task.priority || 'Medium'}
      </p>
      {task.deadline ? (
        <p className="text-xs text-slate-500">Due: {task.deadline.slice(0, 10)}</p>
      ) : null}
      <p className="text-xs text-slate-500">Assignee: {assignee}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {otherStatuses.map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy}
            onClick={() => moveTo(status)}
            className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-100"
          >
            {status}
          </button>
        ))}
      </div>

      {isManager ? (
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="mt-2 text-xs font-medium text-red-600 hover:underline"
        >
          Delete
        </button>
      ) : null}

      <CommentsSection
        taskId={task.taskId}
        expanded={commentsOpen}
        onToggle={() => setCommentsOpen((v) => !v)}
      />
    </article>
  );
}
