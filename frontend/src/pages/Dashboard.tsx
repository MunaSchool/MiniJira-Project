import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Welcome back, {user?.email || 'Manager'}!</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Tasks</CardTitle></CardHeader>
            <CardContent>Manage your tasks in the Kanban board.</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
            <CardContent>View and manage projects.</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Team</CardTitle></CardHeader>
            <CardContent>Collaborate with your team.</CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
