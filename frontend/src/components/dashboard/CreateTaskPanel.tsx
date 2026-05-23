import { useEffect, useState } from 'react';
import { createTask } from '@/services/tasks.service';
import { getUsersByTeam } from '@/services/users.service';
import { getPresignedUrl, uploadFileToS3 } from '@/services/uploads.service';
import type { Task } from '@/types/tasks';
import type { TeamOption } from '@/lib/teams';
import { toast } from 'sonner';

interface CreateTaskPanelProps {
  teams: TeamOption[];
  onCreated: (task: Task) => void;
}

export function CreateTaskPanel({ teams, onCreated }: CreateTaskPanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [teamId, setTeamId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [members, setMembers] = useState<{ userId: string; name?: string; email?: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      setAssigneeId('');
      return;
    }
    getUsersByTeam(teamId)
      .then((users) => setMembers(users.filter((u) => u.role !== 'Manager')))
      .catch(() => toast.error('Could not load team members'));
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !teamId || !assigneeId) {
      toast.error('Title, team, and assignee are required');
      return;
    }

    setSubmitting(true);
    try {
      let imageKey: string | undefined;
      if (file) {
        const presigned = await getPresignedUrl(file.name, file.type);
        await uploadFileToS3(presigned.uploadUrl, file);
        imageKey = presigned.key;
      }

      const task = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        deadline: deadline || undefined,
        assigneeId,
        teamId,
        imageKey,
        status: 'To Do'
      });

      onCreated(task);
      setTitle('');
      setDescription('');
      setDeadline('');
      setFile(null);
      toast.success('Task created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Create task</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Title *</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Description *</span>
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Deadline</span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Team *</span>
          <select
            required
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a team first</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Assignee *</span>
          <select
            required
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            disabled={!teamId}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            <option value="">Select assignee</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name || m.email || m.userId}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
