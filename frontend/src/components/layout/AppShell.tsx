import { Bell, ChevronDown, LayoutDashboard, LifeBuoy, LogOut, PanelLeft, Settings, User, FolderKanban, CheckCircle2, Users } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { normalizeRole } from '@/lib/auth-utils';

type SidebarItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  role?: 'manager' | 'employee';
};

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const sidebarBase: SidebarItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Tasks', path: '/tasks', icon: CheckCircle2 },
  { label: 'Teams', path: '/teams', icon: Users },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings }
];

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = normalizeRole(session?.role ?? '') ?? '';
  const sidebarItems = useMemo(
    () => sidebarBase.filter((item) => !item.role || item.role === role),
    [role]
  );

  const initials = useMemo(() => {
    const source = session?.user?.name || session?.user?.email || 'U';
    return source
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [session?.user?.name, session?.user?.email]);

  const avatarUrl = useMemo(() => {
    const user = session?.user as { avatarUrl?: string; imageUrl?: string; photoUrl?: string } | undefined;
    return user?.avatarUrl || user?.imageUrl || user?.photoUrl;
  }, [session?.user]);

  useEffect(() => {
    const stored = localStorage.getItem('mini_jira_sidebar_collapsed');
    if (stored) setIsCollapsed(stored === 'true');
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('mini_jira_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            'sticky top-0 hidden h-screen flex-col border-r border-border bg-[var(--sidebar-surface)] py-6 text-[var(--sidebar-text)] shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-300 lg:flex',
            isCollapsed ? 'w-[88px] px-3' : 'w-[260px] px-5'
          )}
        >
          <div className="flex items-center justify-between gap-3 text-[var(--sidebar-text)]">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Go to dashboard"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sidebar-highlight)] text-[var(--sidebar-text)] shadow-glow">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              {!isCollapsed ? (
                <div>
                  <p className="text-sm font-semibold text-[var(--sidebar-text)]">Mini Jira</p>
                  <p className="text-xs text-[var(--sidebar-muted)]">Team Workspace</p>
                </div>
              ) : null}
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)]"
              onClick={toggleSidebar}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>

          <nav className="mt-8 space-y-1 text-sm">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/tasks' && location.pathname === '/my-tasks');
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left transition',
                    isActive
                      ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text)] shadow-[inset_3px_0_0_var(--sidebar-active-glow)]'
                      : 'text-[var(--sidebar-muted)] hover:bg-[rgba(59,130,246,0.08)] hover:text-[var(--sidebar-text)]'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full transition',
                      isActive
                        ? 'bg-[var(--sidebar-highlight)] text-[var(--sidebar-text)]'
                        : 'bg-transparent text-[var(--sidebar-muted)] group-hover:text-[var(--sidebar-text)]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isCollapsed ? <span className="font-medium">{item.label}</span> : null}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--sidebar-highlight)] text-[var(--sidebar-text)] text-xs font-semibold">
                  {initials}
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-[var(--sidebar-muted)]">
                  <LifeBuoy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-[var(--sidebar-panel)] p-4 text-xs text-[var(--sidebar-muted)]">
                  <p className="font-semibold text-[var(--sidebar-text)]">Workspace Access</p>
                  <p className="mt-1">
                    Signed in as {session?.user?.email || 'user'} · Role {session?.role || 'member'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-[var(--sidebar-panel)] p-4 text-xs text-[var(--sidebar-muted)]">
                  <div className="flex items-center gap-2 text-[var(--sidebar-text)]">
                    <LifeBuoy className="h-4 w-4" />
                    <p className="font-semibold">Support</p>
                  </div>
                  <p className="mt-1">Help Center · Status · Docs</p>
                </div>
              </>
            )}
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 bg-[var(--navbar-surface)] px-6 py-4 shadow-sm backdrop-blur">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="flex flex-1 items-center justify-end gap-3 lg:justify-between">
              <div className="hidden flex-1 items-center gap-2 rounded-full border border-border bg-[var(--input)] px-4 py-2 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-primary/50 lg:flex">
                <SearchIcon />
                <span>Search tasks, people, or teams</span>
              </div>
              <div className="flex items-center gap-2">
                {actions}
                <Button variant="outline" size="icon" className="group h-9 w-9">
                  <Bell className="h-4 w-4 text-[var(--navbar-icon)] transition group-hover:text-[var(--navbar-icon-hover)]" />
                </Button>
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 gap-2 rounded-full border-border/50 px-2 shadow-sm transition hover:border-primary/40 hover:bg-[var(--surface-muted)]"
                    >
                      <Avatar className="h-8 w-8 border-border/50">
                        {avatarUrl ? <AvatarImage src={avatarUrl} alt={session?.user?.name || 'Profile'} /> : null}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs font-semibold text-foreground">Account</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 text-muted-foreground" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        navigate('/login', { replace: true });
                      }}
                    >
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="flex-1" style={{ padding: 'var(--app-padding-y) var(--app-padding-x)' }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm8 2-4.35-4.35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
