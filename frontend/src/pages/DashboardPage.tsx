import { CheckCircle2, Clock, FolderKanban, ListChecks, Plus, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskStatus } from '@/types/tasks';

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: typeof CheckCircle2;
};

const TASK_COLUMNS: Array<{ label: string; status: TaskStatus | 'Done' }> = [
  { label: 'To Do', status: 'To Do' },
  { label: 'In Progress', status: 'In Progress' },
  { label: 'Completed', status: 'Done' }
];

export function DashboardPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error } = useTasks();
  const tasks = data?.tasks ?? [];

  const displayName = useMemo(() => {
    const name = session?.user?.name?.trim();
    if (name) return name.split(' ')[0];
    const email = session?.user?.email?.split('@')[0];
    return email || 'there';
  }, [session?.user?.email, session?.user?.name]);

  const role = (session?.role || 'employee').toLowerCase();
  const canCreateProject = ['admin', 'manager'].includes(role);
  const canCreateTask = ['admin', 'manager', 'employee'].includes(role);

  const teamIds = useMemo(() => {
    const ids = new Set<string>();
    if (session?.teamId) ids.add(session.teamId);
    tasks.forEach((task) => {
      if (task.teamId) ids.add(task.teamId);
    });
    return Array.from(ids);
  }, [session?.teamId, tasks]);

  const completionRate = useMemo(() => {
    if (!tasks.length) return 0;
    const completed = tasks.filter((task) => task.status === 'Done').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const projectCount = 0;
  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'Done').length, [tasks]);

  const activityItems = useMemo<ActivityItem[]>(
    () =>
      [...tasks]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
        .slice(0, 6)
        .map((task) => formatActivity(task)),
    [tasks]
  );

  const taskColumns = useMemo(
    () =>
      TASK_COLUMNS.map((column) => {
        const items = tasks.filter((task) => (task.status || 'To Do') === column.status);
        return { ...column, count: items.length, tasks: items.slice(0, 3) };
      }),
    [tasks]
  );

  const teamCards = useMemo(
    () =>
      teamIds.slice(0, 4).map((id) => ({
        id,
        name: `Team ${id}`,
        role: session?.role || 'member'
      })),
    [session?.role, teamIds]
  );

  return (
    <AppShell title="Dashboard" subtitle="Track projects, tasks, and team activity at a glance.">
      {error ? (
        <div className="rounded-2xl border border-border/50 bg-[var(--surface)] p-6 text-sm text-red-600">
          {(error as Error).message}
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-border/40 bg-[var(--surface)]">
            <CardContent className="flex flex-col gap-6 pt-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Welcome back, {displayName}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">Here is an overview of your workspace activity.</p>
              </div>
              {(canCreateTask || canCreateProject) && (
                <div className="flex flex-wrap items-center gap-3">
                  {canCreateTask ? (
                    <Button
                      onClick={() => navigate('/tasks')}
                      className="shadow-[0_8px_20px_rgba(59,130,246,0.25)]"
                    >
                      <Plus className="h-4 w-4" />
                      New Task
                    </Button>
                  ) : null}
                  {canCreateProject ? (
                    <Button
                      variant="outline"
                      onClick={() => navigate('/projects')}
                      className="shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                    >
                      <Plus className="h-4 w-4" />
                      New Project
                    </Button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={FolderKanban}
              label="Projects"
              value={projectCount}
              detail={projectCount ? 'Active workspaces' : 'No projects yet'}
              loading={isLoading}
            />
            <SummaryCard
              icon={ListChecks}
              label="Tasks"
              value={openTasks}
              detail={openTasks ? 'Open tasks' : 'No open tasks'}
              loading={isLoading}
            />
            <SummaryCard
              icon={Users}
              label="Teams"
              value={teamIds.length}
              detail={teamIds.length ? 'Active teams' : 'No team data'}
              loading={isLoading}
            />
            <SummaryCard
              icon={TrendingUp}
              label="Completion Rate"
              value={`${completionRate}%`}
              detail={tasks.length ? 'Task completion' : 'No tasks yet'}
              loading={isLoading}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/40 bg-[var(--surface)]">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest task updates across your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                  </div>
                ) : activityItems.length ? (
                  activityItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-primary shadow-sm">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 bg-[var(--surface-muted)] p-4 text-xs text-muted-foreground">
                    No recent activity yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-[var(--surface)]">
              <CardHeader>
                <CardTitle>Projects Overview</CardTitle>
                <CardDescription>Recent workspaces and project health.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 bg-[var(--surface-muted)] p-4 text-xs text-muted-foreground">
                    No projects available.
                    {canCreateProject ? (
                      <div className="mt-3">
                        <Button variant="outline" onClick={() => navigate('/projects')}>
                          Create Project
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/40 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Task Overview</CardTitle>
              <CardDescription>Track task flow across the main stages.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <Skeleton className="h-36" />
                  <Skeleton className="h-36" />
                  <Skeleton className="h-36" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {taskColumns.map((column) => (
                    <div
                      key={column.label}
                      className="rounded-[16px] border border-border/40 bg-[var(--surface-muted)] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{column.label}</p>
                        <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-muted-foreground">
                          {column.count}
                        </span>
                      </div>
                      <div className="mt-3 space-y-3">
                        {column.tasks.length ? (
                          column.tasks.map((task) => (
                            <div
                              key={task.taskId}
                              className="rounded-xl border border-border/40 bg-[var(--surface)] p-3 text-sm shadow-[0_6px_16px_rgba(15,23,42,0.08)]"
                            >
                              <p className="font-semibold text-foreground">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.priority ? `${task.priority} priority` : 'Priority not set'}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No tasks in this stage.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Teams Overview</CardTitle>
              <CardDescription>Teams you collaborate with across the workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                </div>
              ) : teamCards.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {teamCards.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-2xl border border-border/40 bg-[var(--surface-muted)] p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]"
                    >
                      <p className="font-semibold text-foreground">{team.name}</p>
                      <div className="mt-2 text-xs text-muted-foreground">Members unavailable</div>
                      <div className="mt-2 text-xs text-muted-foreground">Role: {team.role}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-[var(--surface-muted)] p-4 text-xs text-muted-foreground">
                  No team assigned.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  loading
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number | string;
  detail: string;
  loading: boolean;
}) {
  return (
    <Card className="rounded-[18px] border-border/40 bg-[var(--surface)]">
      <CardContent className="flex items-center justify-between gap-4 pt-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-3 h-7 w-20" /> : <p className="mt-2 text-3xl font-semibold">{value}</p>}
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-primary shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatActivity(task: Task): ActivityItem {
  const status = task.status || 'To Do';
  if (status === 'Done') {
    return {
      id: task.taskId,
      title: 'Task completed',
      description: task.title,
      time: formatDate(task.updatedAt || task.createdAt),
      icon: CheckCircle2
    };
  }
  if (status === 'In Progress') {
    return {
      id: task.taskId,
      title: 'Task in progress',
      description: task.title,
      time: formatDate(task.updatedAt || task.createdAt),
      icon: Clock
    };
  }
  return {
    id: task.taskId,
    title: 'Task updated',
    description: task.title,
    time: formatDate(task.updatedAt || task.createdAt),
    icon: ListChecks
  };
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}
