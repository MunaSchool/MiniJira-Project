import { Calendar, ClipboardList, MessageSquare, Paperclip, Trash2, Upload } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import type { Task, TaskStatus } from '@/types/tasks';
import { toast } from '@/hooks/use-toast';

const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CLOUDFRONT_URL = (import.meta.env.VITE_CLOUDFRONT_URL as string | undefined) || '';

const USERS = [
  { id: '40eca9bc-30d1-70d4-bc1e-657bc062e1b1', name: 'Sara Developer', teamId: 'team-frontend' },
  { id: '50ccd9dc-2061-703f-48d2-ade1bda28ec3', name: 'Omar Backend', teamId: 'team-backend' }
];

interface TaskComment {
  commentId: string;
  taskId: string;
  text: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PresignResponse {
  uploadUrl: string;
  key: string;
  imageUrl: string;
  resizedImageUrl: string;
}

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
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [attachmentKey, setAttachmentKey] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEdit = mode === 'edit';

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
      setAttachmentKey(task.imageKey || '');
      setAttachmentName(getAttachmentFileName(task.imageKey || ''));
      setAttachmentPreviewUrl(resolveAttachmentUrl(task.imageKey));
      return;
    }

    setTitle('');
    setDescription('');
    setPriority('');
    setDeadline('');
    setAssigneeId(defaultAssigneeId || '');
    setTeamId(defaultTeamId || '');
    setStatus('To Do');
    setAttachmentKey('');
    setAttachmentName('');
    setAttachmentPreviewUrl('');
  }, [open, task, isEdit, defaultAssigneeId, defaultTeamId]);

  useEffect(() => {
    if (!open || !isEdit || !task?.taskId) {
      setComments([]);
      setCommentsLoading(false);
      setCommentsError(null);
      setNewComment('');
      return;
    }

    let cancelled = false;
    setCommentsLoading(true);
    setCommentsError(null);

    api
      .get<TaskComment[]>(`/api/comments/${task.taskId}`)
      .then(({ data }) => {
        if (!cancelled) {
          setComments(Array.isArray(data) ? data : []);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setComments([]);
          setCommentsError(getErrorMessage(error, 'Unable to load comments.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, isEdit, task?.taskId]);

  const handleAssigneeChange = (value: string) => {
    setAssigneeId(value);
    const selectedUser = USERS.find((user) => user.id === value);
    if (selectedUser?.teamId) setTeamId(selectedUser.teamId);
  };

  const handleCommentSubmit = async () => {
    if (!task?.taskId) {
      return;
    }

    

    const text = newComment.trim();
    if (!text) {
      toast({
        variant: 'destructive',
        title: 'Comment required',
        description: 'Write a comment before submitting.'
      });
      return;
    }

    try {
      setIsCommentSubmitting(true);
      const { data } = await api.post<TaskComment>(`/api/comments/${task.taskId}`, { text });
      setComments((current) => [data, ...current]);
      setNewComment('');
      toast({ title: 'Comment added', description: 'The discussion was updated.' });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Could not add comment',
        description: getErrorMessage(error, 'Failed to create comment.')
      });
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleAttachmentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Unsupported file type',
        description: 'Use a JPEG, PNG, or WebP image.'
      });
      event.target.value = '';
      return;
    }

    try {
      setIsUploadingAttachment(true);
      const { data } = await api.post<PresignResponse>('/api/uploads/presigned-url', {
        fileName: file.name,
        contentType: file.type
      });

      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setAttachmentKey(data.key);
      setAttachmentName(file.name);
      setAttachmentPreviewUrl(data.resizedImageUrl || data.imageUrl);
      toast({ title: 'Attachment uploaded', description: 'It will be saved with the task.' });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: getErrorMessage(error, 'Unable to upload attachment.')
      });
    } finally {
      setIsUploadingAttachment(false);
      event.target.value = '';
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = () => {
    const nextImageKey = attachmentKey || task?.imageKey || undefined;

    if (isEdit && task) {
      if (isManager) {
        onSubmit({
          title: title.trim(),
          description: description.trim() || undefined,
          priority: priority || undefined,
          deadline: deadline || undefined,
          assigneeId: assigneeId.trim() || undefined,
          teamId: teamId.trim() || undefined,
          status,
          imageKey: nextImageKey
        });
      } else {
        onSubmit({ status, imageKey: nextImageKey });
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
      status,
      imageKey: nextImageKey
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
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Task Details' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Review and update live task data.' : 'Add a task that syncs with the backend immediately.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1.8fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Title</label>
              <Input className="pl-3" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!isManager && isEdit} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isManager && isEdit} />
            </div>

            <div className="rounded-xl border border-border/50 bg-[var(--surface-muted)] p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ClipboardList className="h-4 w-4" />
                Task Discussion
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {isEdit && task?.taskId ? 'Comments are saved with this task.' : 'Save the task first to start a discussion.'}
              </p>

              {isEdit && task?.taskId ? (
                <div className="mt-3 space-y-3">
                  {isManager ? (
                    <>
                      <Textarea
                        value={newComment}
                        onChange={(event) => setNewComment(event.target.value)}
                        placeholder="Write a comment..."
                        rows={3}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-muted-foreground">Visible to everyone with access to the task.</p>
                        <Button type="button" variant="outline" onClick={handleCommentSubmit} disabled={isCommentSubmitting}>
                          Add comment
                        </Button>
                      </div>
                    </>
                  ) : null}

                  {commentsLoading ? (
                    <div className="rounded-xl border border-dashed border-border/50 bg-[var(--surface)] p-3 text-xs text-muted-foreground">
                      Loading comments...
                    </div>
                  ) : commentsError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {commentsError}
                    </div>
                  ) : comments.length ? (
                    <div className="space-y-2">
                      {comments.map((comment) => (
                        <div key={comment.commentId} className="rounded-xl border border-border/50 bg-[var(--surface)] p-3">
                          <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{comment.createdBy || 'Team member'}</span>
                            <span>{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="mt-2 text-sm text-foreground">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/50 bg-[var(--surface)] p-3 text-xs text-muted-foreground">
                      No comments yet.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-border/50 bg-[var(--surface-muted)] p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Paperclip className="h-4 w-4" />
                Attachments
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Upload an image attachment and save it with the task.</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                >
                  <Upload className="h-4 w-4" />
                  {isUploadingAttachment ? 'Uploading...' : 'Upload image'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAttachmentUpload}
                />
                {attachmentName || attachmentKey ? (
                  <span className="text-xs text-muted-foreground">{attachmentName || attachmentKey}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">PNG, JPG, or WebP</span>
                )}
              </div>

              {attachmentPreviewUrl ? (
                <div className="mt-3 rounded-xl border border-border/50 bg-[var(--surface)] p-3">
                  <p className="mb-2 text-xs text-muted-foreground">Attachment preview</p>
                  <a href={attachmentPreviewUrl} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={attachmentPreviewUrl}
                      alt={attachmentName || 'Task attachment'}
                      className="max-h-40 w-full rounded-lg object-contain"
                    />
                  </a>
                </div>
              ) : attachmentKey ? (
                <div className="mt-3 rounded-xl border border-border/50 bg-[var(--surface)] p-3 text-xs text-muted-foreground">
                  Attachment is linked. Add `VITE_CLOUDFRONT_URL` to preview stored files by key.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-[var(--surface)] p-3 shadow-card">
              <p className="text-xs font-semibold text-muted-foreground">Status</p>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{status}</Badge>
                <span>Last updated</span>
                <span className="font-semibold text-foreground">{formatDate(task?.updatedAt || task?.createdAt)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-[var(--surface)] p-3 shadow-card">
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
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/50 bg-[var(--surface)] p-3 shadow-card">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                <Select value={priority} onValueChange={setPriority} disabled={!isManager && isEdit}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
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
                    onChange={(e) => setDeadline(e.target.value)}
                    disabled={!isManager && isEdit}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/50 bg-[var(--surface)] p-3 shadow-card">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Assignee</label>
                <Select value={assigneeId} onValueChange={handleAssigneeChange} disabled={!isManager && isEdit}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {USERS.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Team</label>
                <Input className="mt-2 pl-3" value={teamId} disabled />
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
            <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={isSubmitting}>
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function resolveAttachmentUrl(imageKey?: string) {
  if (!imageKey) return '';
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    return imageKey;
  }
  if (!CLOUDFRONT_URL) {
    return '';
  }
  const base = CLOUDFRONT_URL.replace(/\/+$/, '');
  const key = imageKey.replace(/^\/+/, '');
  return `${base}/${key}`;
}

function getAttachmentFileName(imageKey: string) {
  if (!imageKey) return '';
  try {
    const cleaned = imageKey.includes('://') ? new URL(imageKey).pathname : imageKey;
    const parts = cleaned.split('/').filter(Boolean);
    return parts[parts.length - 1] || imageKey;
  } catch {
    const parts = imageKey.split('/').filter(Boolean);
    return parts[parts.length - 1] || imageKey;
  }
}