import { CalendarDays, Camera, CheckCircle2, ClipboardCheck, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';
import { getProfile, updateProfile } from '@/services/user.service';

export function ProfilePage() {
  const { session, logout, updateSessionUser } = useAuth();
  const navigate = useNavigate();
  const { data: taskData } = useTasks();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    onError: (error: Error) => {
      if (error.message.toLowerCase().includes('expired')) {
        logout();
        navigate('/login', { replace: true });
      }
      toast({
        variant: 'destructive',
        title: 'Profile load failed',
        description: error.message || 'Unable to load your profile.'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      updateSessionUser(updated);
      setIsEditing(false);
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    },
    onError: (error: Error) => {
      if (error.message.toLowerCase().includes('expired')) {
        logout();
        navigate('/login', { replace: true });
        toast({
          variant: 'destructive',
          title: 'Session expired',
          description: 'Please sign in again.'
        });
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message || 'Unable to update your profile.'
      });
    }
  });

  const displayName = useMemo(
    () => profile?.name || session?.user?.name || '',
    [profile?.name, session?.user?.name]
  );
  const displayEmail = useMemo(
    () => profile?.email || session?.user?.email || '',
    [profile?.email, session?.user?.email]
  );
  const avatarUrl = useMemo(() => {
    const user = profile ?? session?.user;
    const source = user as { avatarUrl?: string; imageUrl?: string; photoUrl?: string } | undefined;
    return source?.avatarUrl || source?.imageUrl || source?.photoUrl;
  }, [profile, session?.user]);

  const stats = useMemo(() => {
    const tasks = taskData?.tasks ?? [];
    return {
      total: tasks.length,
      inProgress: tasks.filter((task) => task.status === 'In Progress').length,
      completed: tasks.filter((task) => task.status === 'Done').length
    };
  }, [taskData?.tasks]);

  useEffect(() => {
    if (profile?.name) setFullName(profile.name);
    if (profile?.email) setEmail(profile.email);
  }, [profile?.name, profile?.email]);

  useEffect(() => {
    if (session?.user?.name && !fullName) setFullName(session.user.name);
    if (session?.user?.email && !email) setEmail(session.user.email);
  }, [session?.user?.name, session?.user?.email, fullName, email]);

  const handleSave = () => {
    if (!fullName.trim() || !email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Name and email are required.'
      });
      return;
    }
    updateMutation.mutate({ name: fullName.trim(), email: (profile?.email || session?.user?.email || '').trim() });
  };

  const handleCancel = () => {
    setFullName(profile?.name || session?.user?.name || '');
    setEmail(profile?.email || session?.user?.email || '');
    setIsEditing(false);
  };

  return (
    <AppShell title="Profile" subtitle="Manage the information tied to your account.">
      <div className="space-y-6">
        <Card className="border-border/50 bg-[var(--surface-strong)]">
          <CardHeader className="flex flex-wrap items-center gap-5 py-4">
            <div className="group relative">
              <Avatar className="h-20 w-20 border-border/50 ring-2 ring-secondary/40">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName || 'Profile'} /> : null}
                <AvatarFallback className="text-lg">{(displayName || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {isEditing ? (
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-[var(--surface)] text-muted-foreground shadow-sm transition group-hover:text-foreground"
                  onClick={() =>
                    toast({
                      title: 'Upload disabled',
                      description: 'Avatar uploads are available once the backend is ready.'
                    })
                  }
                >
                  <Camera className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="flex-1">
              <CardTitle>{displayName || 'Profile'}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{displayEmail || 'No email on file'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Role {profile?.role || session?.role || '—'}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team {profile?.teamId || session?.teamId || '—'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)} className="shadow-card">
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 border-t border-border/50 pt-5 md:grid-cols-4">
            <HeroStat label="Assigned" value={stats.total} />
            <HeroStat label="Active" value={stats.inProgress} />
            <HeroStat label="Completed" value={stats.completed} />
            <HeroStat label="Activity" value={Math.min(stats.total, 12)} />
          </CardContent>
          {isEditing ? (
            <CardContent className="grid gap-6 border-t border-border/50 pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
                <Input
                  className="pl-3"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  disabled={isLoading || updateMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Email (read only)</label>
                <Input className="pl-3" value={displayEmail} disabled />
              </div>
            </CardContent>
          ) : null}
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/50 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <InfoRow label="Full Name" value={displayName || '—'} loading={isLoading} />
              <InfoRow label="Email" value={displayEmail || '—'} loading={isLoading} />
              <InfoRow label="Role" value={profile?.role || session?.role || '—'} loading={isLoading} />
              <InfoRow label="Team" value={profile?.teamId || session?.teamId || '—'} loading={isLoading} />
              <InfoRow label="Joined" value="—" loading={isLoading} icon={CalendarDays} />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Workspace Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <SummaryRow label="Assigned tasks" value={stats.total} />
              <SummaryRow label="Active work" value={stats.inProgress} />
              <SummaryRow label="Completed" value={stats.completed} />
              <div className="rounded-xl border border-border/50 bg-[var(--surface-muted)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ClipboardCheck className="h-4 w-4" />
                  Recent activity
                </div>
                <p className="mt-2 text-xs text-muted-foreground">No recent activity yet.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 bg-[var(--surface-muted)]">
          <CardContent className="flex items-start gap-3 text-xs text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Privacy Tip</p>
              <p>Your organization admin can see your name, email, and team membership.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-[var(--surface)] p-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  loading,
  icon: Icon
}: {
  label: string;
  value: string;
  loading: boolean;
  icon?: typeof CalendarDays;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      {loading ? <Skeleton className="h-6 w-32" /> : <p className="text-sm">{value}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-[var(--surface-muted)] px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
