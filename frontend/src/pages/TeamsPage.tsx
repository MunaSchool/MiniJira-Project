import { Users } from 'lucide-react';
import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types/tasks';

interface TeamSummary {
  id: string;
  tasks: Task[];
  members: string[];
}

export function TeamsPage() {
  const { data, isLoading, error } = useTasks();
  const tasks = data?.tasks ?? [];

  const teams = useMemo<TeamSummary[]>(() => {
    const grouped = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const key = task.teamId || 'General';
      grouped.set(key, [...(grouped.get(key) ?? []), task]);
    });
    return Array.from(grouped.entries()).map(([id, group]) => ({
      id,
      tasks: group,
      members: Array.from(new Set(group.map((task) => task.assigneeId).filter(Boolean))).slice(0, 5)
    }));
  }, [tasks]);

  const recentActivity = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
        .slice(0, 6),
    [tasks]
  );

  return (
    <AppShell title="Teams" subtitle="Keep track of delivery health across every squad.">
      {error ? (
        <div className="rounded-2xl border border-border/50 bg-[var(--surface)] p-6 text-sm text-red-600">
          {(error as Error).message}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
          <div className="space-y-6">
            <Card className="border-border/50 bg-[var(--surface)]">
              <CardHeader className="flex-row items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/30 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Team overview</CardTitle>
                  <p className="text-sm text-muted-foreground">Members and task load aggregated from the board.</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, index) => <Skeleton key={`team-${index}`} className="h-32" />)
                ) : teams.length ? (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-2xl border border-border/50 bg-[var(--surface)] p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Team {team.id}</p>
                          <p className="text-xs text-muted-foreground">{team.tasks.length} active tasks</p>
                        </div>
                        <Badge variant="muted">Active</Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {team.members.length ? (
                            team.members.map((member) => (
                              <Avatar key={member} className="h-8 w-8 border border-background">
                                <AvatarFallback className="text-[10px] font-semibold">
                                  {member.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No members yet</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {countByStatus(team.tasks, 'In Progress')} in progress
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    No teams available yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-[var(--surface)]">
              <CardHeader>
                <CardTitle>Team Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <MetricItem label="Teams tracked" value={teams.length} />
                <MetricItem label="Tasks in review" value={countByStatus(tasks, 'In Review')} />
                <MetricItem label="Completed" value={countByStatus(tasks, 'Done')} />
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit border-border/50 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Team Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                </div>
              ) : recentActivity.length ? (
                recentActivity.map((task) => (
                  <div key={task.taskId} className="rounded-xl border border-border/50 bg-[var(--surface)] p-3">
                    <p className="font-semibold text-foreground">{task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Team {task.teamId || '—'} · {task.status || 'To Do'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                  Activity will appear once tasks are created.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function MetricItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-[var(--surface-muted)] p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function countByStatus(tasks: Task[], status: string) {
  return tasks.filter((task) => (task.status || 'To Do') === status).length;
}
