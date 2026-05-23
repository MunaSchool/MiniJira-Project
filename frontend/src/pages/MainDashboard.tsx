import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getTasks } from '@/services/tasks.service';
import { getUsersByTeam } from '@/services/users.service';
import { checkHealth } from '@/services/health.service';
import type { Task } from '@/types/tasks';
import { loadTeamOptions } from '@/lib/teams';
import { CreateTaskPanel } from '@/components/dashboard/CreateTaskPanel';
import { ApiEndpointsPanel } from '@/components/dashboard/ApiEndpointsPanel';
import { KanbanDashboard } from '@/components/dashboard/KanbanDashboard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MainDashboard() {
  const { profile, logout, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string>>({});

  const teams = useMemo(() => loadTeamOptions(), []);
  const isManager = profile?.role === 'Manager';

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { tasks: list } = await getTasks();
      setTasks(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!isManager) return;
    const teamIds = [...new Set(tasks.map((t) => t.teamId))];
    Promise.all(teamIds.map((id) => getUsersByTeam(id).catch(() => []))).then((results) => {
      const map: Record<string, string> = {};
      results.flat().forEach((u) => {
        map[u.userId] = u.name || u.email || u.userId;
      });
      setAssigneeNames(map);
    });
  }, [tasks, isManager]);

  useEffect(() => {
    if (profile?.teamId && !isManager) {
      getUsersByTeam(profile.teamId)
        .then((users) => {
          const map: Record<string, string> = {};
          users.forEach((u) => {
            map[u.userId] = u.name || u.email || u.userId;
          });
          setAssigneeNames(map);
        })
        .catch(() => undefined);
    }
  }, [profile?.teamId, isManager]);

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-blue-700">Mini Jira AWS</p>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            {profile ? (
              <p className="mt-1 text-sm text-slate-600">
                {profile.email}{' '}
                <span className="font-semibold text-blue-600">{profile.role}</span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/home" className="text-sm font-medium text-blue-600 hover:underline">
              Home
            </Link>
            <Link to="/api" className="text-sm font-medium text-blue-600 hover:underline">
              API status
            </Link>
            {apiOk === false ? (
              <Link to="/api" className="text-xs text-amber-600 hover:underline">
                API offline — tap to check
              </Link>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => refreshProfile()}>
              Refresh profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadTasks()}>
              Refresh tasks
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <ApiEndpointsPanel />

        {isManager ? <CreateTaskPanel teams={teams} onCreated={(t) => setTasks((prev) => [t, ...prev])} /> : null}

        {loading ? (
          <p className="text-slate-600">Loading board…</p>
        ) : (
          <KanbanDashboard
            tasks={tasks}
            isManager={isManager}
            teams={teams}
            assigneeNames={assigneeNames}
            onTaskUpdated={(updated) =>
              setTasks((prev) => prev.map((t) => (t.taskId === updated.taskId ? updated : t)))
            }
            onTaskDeleted={(id) => setTasks((prev) => prev.filter((t) => t.taskId !== id))}
          />
        )}
      </main>
    </div>
  );
}
