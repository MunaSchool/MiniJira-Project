import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useState } from 'react';

interface ProfileFormData {
  name: string;
  email: string;
}

export function ProfilePage() {
  const { session, updateSessionUser } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  });

  // Fetch profile from backend (optional, if your backend has a /profile endpoint)
  useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/profile', {
        headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
      });
      return data;
    },
    enabled: false, // Disable if you don't have backend endpoint
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.put('/api/users/profile', data, {
        headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
      });
      return response.data;
    },
    onSuccess: (updatedUser) => {
      // Update local session
      updateSessionUser({ email: updatedUser.email, name: updatedUser.name, sub: session?.user?.sub || '' });
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (!session) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={session.role || 'Employee'} disabled />
            </div>
            <div className="space-y-2">
              <Label>Team ID</Label>
              <Input value={session.teamId || '—'} disabled />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}