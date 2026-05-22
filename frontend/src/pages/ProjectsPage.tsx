import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { getProjects, createProject, deleteProject } from '@/api/projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await getProjects();
      setProjects(data);
    } catch (err) {
      toast.error('Failed to load projects');
    }
  };

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    try {
      await createProject({ name: newProjectName });
      toast.success('Project created');
      fetchProjects();
      setNewProjectName('');
    } catch (err) {
      toast.error('Create failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      toast.success('Deleted');
      fetchProjects();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex gap-2">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            className="border rounded p-2 flex-1"
          />
          <Button onClick={handleCreate}>Create</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <Card key={proj.projectId}>
              <CardHeader><CardTitle>{proj.name}</CardTitle></CardHeader>
              <CardContent>
                <p>{proj.description || 'No description'}</p>
                <Button variant="outline" onClick={() => handleDelete(proj.projectId)}>
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}