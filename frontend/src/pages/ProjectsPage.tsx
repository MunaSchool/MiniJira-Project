import { ArrowRight, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types/tasks';

interface ProjectSummary {
  id: string;
  name: string;
  teamId: string;
  tasks: Task[];
  members: string[];
  progress: number;
  status: 'On Track' | 'In Review' | 'Delayed';
}

function getStatus(progress: number): ProjectSummary['status'] {
  if (progress >= 80) return 'On Track';
  if (progress >= 45) return 'In Review';
  return 'Delayed';
}

export function ProjectsPage() {
  const { data, isLoading, error } = useTasks();
  const tasks = data?.tasks ?? [];

  const projects = useMemo<ProjectSummary[]>(() => {
    const groups = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const key = task.teamId || 'General';
      const existing = groups.get(key) ?? [];
      existing.push(task);
      groups.set(key, existing);
    });

    return Array.from(groups.entries()).map(([teamId, group]) => {
      const completed = group.filter((task) => task.status === 'Done').length;
      const progress = group.length ? Math.round((completed / group.length) * 100) : 0;
      const members = Array.from(new Set(group.map((task) => task.assigneeId).filter(Boolean))).slice(0, 4);
      return {
        id: teamId,
        name: teamId === 'General' ? 'Cloud Workspace Refresh' : `Team ${teamId} Delivery`,
        teamId,
        tasks: group,
        members,
        progress,
        status: getStatus(progress)
      };
    });
  }, [tasks]);

  return (
    <AppShell title="Projects" subtitle="Track delivery, owners, and progress across active initiatives.">
      {error ? (
        <div className="rounded-2xl border border-border/50 bg-[var(--surface)] p-6 text-sm text-red-600">
          {(error as Error).message}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-[var(--surface)] p-6 shadow-card">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
              <h2 className="mt-2 text-2xl font-semibold">Active delivery streams</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each project card aggregates the tasks assigned to a team.
              </p>
            </div>
            <Button type="button">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
            <div className="grid gap-4 md:grid-cols-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={`project-${index}`} className="h-48" />)
              ) : projects.length ? (
                projects.map((project) => (
                  <Card key={project.id} className="transition hover:-translate-y-0.5 hover:shadow-card-hover">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={statusBadgeClass(project.status)}>{project.status}</Badge>
                        <span className="text-xs text-muted-foreground">{project.tasks.length} tasks</span>
                      </div>
                      <CardTitle>{project.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">Owned by {project.teamId}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span className="font-semibold text-foreground">{project.progress}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {project.members.length ? (
                            project.members.map((member) => (
                              <Avatar key={member} className="h-8 w-8 border border-background">
                                <AvatarFallback className="text-[10px] font-semibold">
                                  {member.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No assignees yet</span>
                          )}
                        </div>
                        <Button variant="ghost" className="h-9 px-3 text-xs">
                          View Project
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>No projects yet</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Create your first project once tasks are available from the backend.
                    </p>
                  </CardHeader>
                </Card>
              )}
            </div>

            <Card className="h-fit border-border/50 bg-[var(--surface)]">
              <CardHeader>
                <CardTitle>Project Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-xl border border-border/50 bg-[var(--surface-muted)] p-4">
                  <p className="text-xs text-muted-foreground">On-track initiatives</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {projects.filter((project) => project.status === 'On Track').length}
                  </p>
                </div>
                <div className="space-y-3">
                  {projects.slice(0, 4).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.progress}% complete</p>
                      </div>
                      <Badge variant="muted" className="text-[10px]">
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                  {!projects.length && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                      Project highlights appear once tasks are created.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function statusBadgeClass(status: ProjectSummary['status']) {
  if (status === 'On Track') {
    return 'bg-primary/10 text-primary';
  }
  if (status === 'In Review') {
    return 'bg-[#a19299]/25 text-foreground';
  }
  return 'bg-muted/80 text-muted-foreground';
}
