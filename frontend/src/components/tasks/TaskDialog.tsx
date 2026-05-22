import { Calendar, ClipboardList, MessageSquare, Paperclip, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, TaskStatus } from '@/types/tasks';
import { toast } from '@/hooks/use-toast';

const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

interface TaskDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  task?: Task | null;
  isManager: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Task | Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  isSubmitting?: boolean;
  defaultAssigneeId?: string;
  defaultTeamId?: string;
}

export function TaskDialog({
  open,
  mode,
  task,
  isManager,
  onOpenChange,
  onSubmit,
  onDelete,
  isSubmitting,
  defaultAssigneeId,
  defaultTeamId
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('');
  const [deadline, setDeadline] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = mode === 'edit';
  const statusValue = status;

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (task && isEdit) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || '');
      setDeadline(task.deadline ? task.deadline.slice(0, 10) : '');
      setAssigneeId(task.assigneeId || '');
      setTeamId(task.teamId || '');
      setStatus(task.status || 'To Do');
      return;
    }
    setTitle('');
    setDescription('');
    setPriority('');
    setDeadline('');
    setAssigneeId(defaultAssigneeId || '');
    setTeamId(defaultTeamId || '');
    setStatus('To Do');
  }, [open, task, isEdit, defaultAssigneeId, defaultTeamId]);

  const handleSubmit = () => {
    if (isEdit && task) {
      if (isManager) {
        onSubmit({
          title: title.trim(),
          description: description.trim() || undefined,
          priority: priority || undefined,
          deadline: deadline || undefined,
          assigneeId: assigneeId.trim() || undefined,
          status
        });
      } else {
        onSubmit({ status });
      }
      return;
    }

    if (!title.trim() || !assigneeId.trim() || !teamId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Title, assignee, and team are required.'
      });
      return;
    }

    onSubmit({
      taskId: '',
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority || undefined,
      deadline: deadline || undefined,
      assigneeId: assigneeId.trim(),
      teamId: teamId.trim(),
      status
    });
  };

  const handleDelete = () => {
    if (!task?.taskId || !onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(task.taskId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Task Details' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Review and update live task data.' : 'Add a task that syncs with the backend immediately.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Title</label>
              <Input
                className="pl-3"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={!isManager && isEdit}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={!isManager && isEdit}
              />
            </div>

            <div className="rounded-2xl border border-border/50 bg-[var(--surface-muted)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ClipboardList className="h-4 w-4" />
                Task Discussion
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Comments are unavailable until the backend comments API is added.
              </p>
              <div className="mt-3 rounded-xl border border-dashed border-border/50 bg-[var(--surface)] p-3 text-xs text-muted-foreground">
                No comments available.
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-[var(--surface-muted)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Paperclip className="h-4 w-4" />
                Attachments
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                File uploads are disabled until the backend upload endpoints are ready.
              </p>
              <div className="mt-3 rounded-xl border border-dashed border-border/50 bg-[var(--surface)] p-3 text-xs text-muted-foreground">
                No attachments available.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/50 bg-[var(--surface)] p-4 shadow-card">
              <p className="text-xs font-semibold text-muted-foreground">Status</p>
              <div className="mt-2">
                <Select value={statusValue} onValueChange={(value) => setStatus(value as TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{statusValue}</Badge>
                <span>Last updated</span>
                <span className="font-semibold text-foreground">{formatDate(task?.updatedAt || task?.createdAt)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-[var(--surface)] p-4 shadow-card">
              <p className="text-xs font-semibold text-muted-foreground">Activity</p>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span className="font-semibold text-foreground">{formatDate(task?.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last updated</span>
                  <span className="font-semibold text-foreground">{formatDate(task?.updatedAt)}</span>
                </div>
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Audit history appears when backend activity logs are exposed.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/50 bg-[var(--surface)] p-4 shadow-card">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                <Select value={priority} onValueChange={setPriority} disabled={!isManager && isEdit}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Deadline</label>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/50 bg-[var(--surface-muted)] px-3 py-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    className="w-full bg-transparent outline-none"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    disabled={!isManager && isEdit}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/50 bg-[var(--surface)] p-4 shadow-card">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Assignee ID</label>
                <Input
                  className="mt-2 pl-3"
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                  disabled={!isManager && isEdit}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Team ID</label>
                <Input
                  className="mt-2 pl-3"
                  value={teamId}
                  onChange={(event) => setTeamId(event.target.value)}
                  disabled={isEdit}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                {task?.commentCount ?? 0} comments saved
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          {isEdit && isManager && onDelete ? (
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? 'Confirm delete' : 'Delete task'}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Close
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isEdit ? (isManager ? 'Save changes' : 'Update status') : 'Create task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}
