import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  type Project
} from '@/services/projects.service';
import { loadTeamOptions } from '@/lib/teams';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const { profile } = useAuth();
  const isManager = profile?.role === 'Manager';
  const teams = loadTeamOptions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchProjects = async () => {
    try {
      const list = await getProjects(isManager ? undefined : profile?.teamId ?? undefined);
      setProjects(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load projects');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [profile?.teamId]);

  const handleCreate = async () => {
    if (!name.trim() || !teamId) return;
    try {
      await createProject({ name: name.trim(), description: description.trim() || undefined, teamId });
      toast.success('Project created');
      setName('');
      setDescription('');
      fetchProjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const handleUpdate = async (projectId: string) => {
    if (!editName.trim()) return;
    try {
      await updateProject(projectId, { name: editName.trim() });
      toast.success('Project updated');
      setEditingId(null);
      fetchProjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast.success('Deleted');
      fetchProjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/home" className="text-sm text-blue-600 hover:underline">
          ← Back to home
        </Link>
      </div>
      <h1 className="mb-4 text-3xl font-bold">Projects</h1>

      {isManager ? (
        <div className="mb-6 flex flex-wrap gap-2 rounded-lg border bg-white p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="min-w-[160px] flex-1 rounded border px-3 py-2"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="min-w-[160px] flex-1 rounded border px-3 py-2"
          />
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded border px-3 py-2">
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Button onClick={handleCreate}>Create project</Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((proj) => (
          <Card key={proj.projectId}>
            <CardHeader>
              {editingId === proj.projectId ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded border px-2 py-1"
                />
              ) : (
                <CardTitle>{proj.name}</CardTitle>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-600">{proj.description || 'No description'}</p>
              <p className="text-xs text-slate-500">Team: {proj.teamId}</p>
              {isManager ? (
                <div className="flex gap-2">
                  {editingId === proj.projectId ? (
                    <Button size="sm" onClick={() => handleUpdate(proj.projectId)}>
                      Save
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(proj.projectId);
                        setEditName(proj.name);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDelete(proj.projectId)}>
                    Delete
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
