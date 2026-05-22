import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { getTasks } from '@/api/tasks';
import { toast } from 'sonner';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await getTasks();
        setTasks(data);
      } catch (err) {
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) return <Layout><div>Loading tasks...</div></Layout>;

  return (
    <Layout>
      <KanbanBoard tasks={tasks} setTasks={setTasks} />
    </Layout>
  );
}

// Force this file to be treated as a module (optional but safe)
export {};