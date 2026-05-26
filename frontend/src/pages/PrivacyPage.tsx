import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SECTIONS = [
  {
    title: 'Data Usage',
    content:
      'Mini Jira stores account and workspace information required for projects, teams, and task collaboration.'
  },
  {
    title: 'Authentication & Security',
    content: 'Authentication, permissions, and access rules are securely managed through backend systems.'
  },
  {
    title: 'Local Preferences',
    content: 'Appearance and notification preferences may be stored locally to improve experience.'
  },
  {
    title: 'Workspace Visibility',
    content:
      'Workspace administrators may access collaboration and role information necessary for workspace management.'
  }
];

export function PrivacyPage() {
  return (
    <AppShell
      title="Privacy & Data"
      subtitle="Understand how Mini Jira stores and manages collaboration data securely."
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {SECTIONS.map((section) => (
            <Card key={section.title} className="border-border/50 bg-[var(--surface)]">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{section.content}</CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50 bg-[var(--surface-muted)]">
          <CardContent className="text-xs text-muted-foreground">Last updated: Build 1.0.0</CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
