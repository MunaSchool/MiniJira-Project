import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  return (
    <Layout>
      <div className="max-w-lg mx-auto mt-10 space-y-6 p-6 bg-card rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-2">Profile & Settings</h1>
        <div className="space-y-2">
          <div><span className="font-semibold">Email:</span> {user?.email}</div>
          <div><span className="font-semibold">Role:</span> {user?.['custom:role'] || 'Employee'}</div>
          <div><span className="font-semibold">Team:</span> {user?.['custom:teamId'] || 'N/A'}</div>
        </div>
        <Button variant="outline" onClick={logout} className="mt-4">Sign out</Button>
      </div>
    </Layout>
  );
}
