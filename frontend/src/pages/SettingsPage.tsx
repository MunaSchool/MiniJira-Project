import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { updateProfile } from '@/services/user.service';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { profile, logout, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, email });
      await refreshProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/home" className="text-sm text-blue-600 hover:underline">
          ← Back to home
        </Link>
      </div>
      <div className="mx-auto mt-6 max-w-lg space-y-6 rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Profile & Settings</h1>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="font-medium">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-medium">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <p>
            <span className="font-semibold">Role:</span> {profile?.role ?? '—'}
          </p>
          <p>
            <span className="font-semibold">Team:</span> {profile?.teamId ?? '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </Layout>
  );
}
