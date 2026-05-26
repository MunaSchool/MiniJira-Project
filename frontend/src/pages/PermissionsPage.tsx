import { CheckCircle2, Shield, XCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Full access to workspace settings, teams, and permissions.',
  manager: 'Can manage projects, tasks, and team workspaces.',
  employee: 'Can collaborate on assigned tasks and team workspaces.',
  viewer: 'Read-only access to workspace content.'
};

const PERMISSIONS_BY_ROLE: Record<string, Record<string, { label: string; allowed: boolean }[]>> = {
  admin: {
    Projects: [
      { label: 'View projects', allowed: true },
      { label: 'Create project', allowed: true },
      { label: 'Delete project', allowed: true }
    ],
    Tasks: [
      { label: 'Create tasks', allowed: true },
      { label: 'Edit assigned tasks', allowed: true },
      { label: 'Manage all tasks', allowed: true }
    ],
    Teams: [
      { label: 'View teams', allowed: true },
      { label: 'Manage teams', allowed: true }
    ],
    Workspace: [
      { label: 'Access workspace', allowed: true },
      { label: 'Change permissions', allowed: true }
    ],
    Account: [
      { label: 'Edit profile', allowed: true },
      { label: 'Manage notifications', allowed: true }
    ]
  },
  manager: {
    Projects: [
      { label: 'View projects', allowed: true },
      { label: 'Create project', allowed: true },
      { label: 'Delete project', allowed: false }
    ],
    Tasks: [
      { label: 'Create tasks', allowed: true },
      { label: 'Edit assigned tasks', allowed: true },
      { label: 'Manage all tasks', allowed: true }
    ],
    Teams: [
      { label: 'View teams', allowed: true },
      { label: 'Manage teams', allowed: false }
    ],
    Workspace: [
      { label: 'Access workspace', allowed: true },
      { label: 'Change permissions', allowed: false }
    ],
    Account: [
      { label: 'Edit profile', allowed: true },
      { label: 'Manage notifications', allowed: true }
    ]
  },
  employee: {
    Projects: [
      { label: 'View projects', allowed: true },
      { label: 'Create project', allowed: false },
      { label: 'Delete project', allowed: false }
    ],
    Tasks: [
      { label: 'Create tasks', allowed: true },
      { label: 'Edit assigned tasks', allowed: true },
      { label: 'Manage all tasks', allowed: false }
    ],
    Teams: [
      { label: 'View teams', allowed: true },
      { label: 'Manage teams', allowed: false }
    ],
    Workspace: [
      { label: 'Access workspace', allowed: true },
      { label: 'Change permissions', allowed: false }
    ],
    Account: [
      { label: 'Edit profile', allowed: true },
      { label: 'Manage notifications', allowed: true }
    ]
  },
  viewer: {
    Projects: [
      { label: 'View projects', allowed: true },
      { label: 'Create project', allowed: false },
      { label: 'Delete project', allowed: false }
    ],
    Tasks: [
      { label: 'Create tasks', allowed: false },
      { label: 'Edit assigned tasks', allowed: false },
      { label: 'Manage all tasks', allowed: false }
    ],
    Teams: [
      { label: 'View teams', allowed: true },
      { label: 'Manage teams', allowed: false }
    ],
    Workspace: [
      { label: 'Access workspace', allowed: true },
      { label: 'Change permissions', allowed: false }
    ],
    Account: [
      { label: 'Edit profile', allowed: true },
      { label: 'Manage notifications', allowed: true }
    ]
  }
};

export function PermissionsPage() {
  const { session } = useAuth();
  const rawRole = (session?.role || 'employee').toLowerCase();
  const role = rawRole in PERMISSIONS_BY_ROLE ? rawRole : 'employee';
  const permissions = PERMISSIONS_BY_ROLE[role];

  return (
    <AppShell title="Permissions" subtitle="View the actions and workspace access available for your account role.">
      <div className="space-y-6">
        <Card className="border-border/50 bg-[var(--surface)]">
          <CardHeader>
            <CardTitle>Current Role</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Badge className="bg-primary/20 text-primary">{role}</Badge>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {ROLE_DESCRIPTIONS[role] ?? 'Workspace access based on your role.'}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(permissions).map(([section, items]) => (
            <Card key={section} className="border-border/50 bg-[var(--surface)]">
              <CardHeader>
                <CardTitle>{section}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-[var(--surface-muted)] px-3 py-2"
                  >
                    <span className="text-foreground">{item.label}</span>
                    {item.allowed ? (
                      <span className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Allowed
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        Restricted
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
