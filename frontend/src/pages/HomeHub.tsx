import { Link } from 'react-router-dom';
import { Activity, FolderKanban, KanbanSquare, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const tiles = [
  {
    title: 'Kanban dashboard',
    description: 'Board, create tasks, move cards',
    path: '/dashboard',
    icon: LayoutDashboard,
    accent: 'bg-blue-600'
  },
  {
    title: 'API status',
    description: 'All 18 endpoints — live GET tests',
    path: '/api',
    icon: Activity,
    accent: 'bg-emerald-600'
  },
  {
    title: 'Tasks',
    description: 'Same board view',
    path: '/tasks',
    icon: KanbanSquare,
    accent: 'bg-violet-600'
  },
  {
    title: 'Projects',
    description: 'Project list and CRUD',
    path: '/projects',
    icon: FolderKanban,
    accent: 'bg-amber-600'
  },
  {
    title: 'Settings',
    description: 'Profile and preferences',
    path: '/settings',
    icon: Settings,
    accent: 'bg-slate-600'
  }
] as const;

export default function HomeHub() {
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-blue-700">Mini Jira AWS</p>
            <h1 className="text-2xl font-semibold text-slate-900">Home</h1>
            {profile ? (
              <p className="mt-1 text-sm text-slate-600">
                {profile.email}{' '}
                <span className="font-semibold text-blue-600">{profile.role}</span>
              </p>
            ) : null}
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="mb-6 text-slate-600">Choose a section — tap a card to open it.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.path}
                to={tile.path}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className={`mb-4 inline-flex rounded-lg p-3 text-white ${tile.accent}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                  {tile.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{tile.description}</p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
