import { useAuth } from '@/hooks/useAuth';

export function MyTasksPage() {
  const { session, logout } = useAuth();
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-8 shadow-card">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="mt-2 text-muted-foreground">Your team task board will appear here.</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Role: {session?.role}
          {session?.teamId ? ` · Team: ${session.teamId}` : ''}
        </p>
        <button type="button" onClick={logout} className="mt-6 text-sm font-semibold text-primary">
          Sign out
        </button>
      </div>
    </main>
  );
}
