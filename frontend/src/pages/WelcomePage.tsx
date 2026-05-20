import { CheckCircle2, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath, normalizeRole } from '@/lib/auth-utils';

export function WelcomePage() {
  const { session, logout } = useAuth();
  const role = normalizeRole(session?.role ?? '');
  const workspacePath = session ? getPostLoginPath(session.role) : '/login';

  return (
    <main className="auth-mesh flex min-h-screen items-center justify-center p-6">
      <div className="glass-card w-full max-w-lg p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={2.25} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Login successful
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Welcome to Mini Jira Cloud</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Authentication worked. This is a test page to confirm your session is active.
        </p>
        {!session?.teamId && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Profile API may be skipped or incomplete. For full access, your user must exist in
            DynamoDB with the same Cognito userId.
          </p>
        )}

        <div className="mt-6 rounded-xl border border-border bg-background/80 p-4 text-left text-sm">
          <p className="font-semibold text-foreground">Session details</p>
          <dl className="mt-3 space-y-2 text-muted-foreground">
            <div className="flex justify-between gap-4">
              <dt>Email</dt>
              <dd className="font-medium text-foreground">{session?.user?.email ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Name</dt>
              <dd className="font-medium text-foreground">{session?.user?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Role</dt>
              <dd className="font-medium text-foreground">{session?.role ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Team ID</dt>
              <dd className="font-medium text-foreground">{session?.teamId ?? '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {role && workspacePath !== '/login' && (
            <Button asChild variant="default" className="sm:min-w-[160px]">
              <Link to={workspacePath}>Go to workspace</Link>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Test route: <span className="font-mono text-foreground">/welcome</span>
        </p>
      </div>
    </main>
  );
}
