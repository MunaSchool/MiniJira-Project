import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, KanbanSquare, FolderKanban, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks (Kanban)', icon: KanbanSquare },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold">Mini‑Jira</h1>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-md transition ${
              location.pathname === item.path
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-secondary'
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <Button variant="outline" onClick={logout} className="w-full justify-start gap-3">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
