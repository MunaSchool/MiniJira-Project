import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AboutPage() {
  return (
    <AppShell
      title="About Mini Jira"
      subtitle="Mini Jira is a lightweight collaborative workspace for managing projects, teams, and task workflows securely."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 bg-[var(--surface)] lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Mini Jira helps teams organize work, manage projects, and collaborate through a focused task management experience.
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-[var(--surface)]">
          <CardHeader>
            <CardTitle>Version</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Frontend: 1.0.0</p>
            <p>Environment: Production</p>
            <p>Status: Active</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-[var(--surface)] lg:col-span-3">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Operational</p>
              <p>Frontend active · Backend connected</p>
            </div>
            <Badge className="bg-[#22C55E]/20 text-[#22C55E]">Healthy</Badge>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
