'use client';

import { useAuth } from '@/lib/auth-context';
import { SettingsPage } from '@/components/settings';
import { toast } from 'sonner';

export default function SettingsPageRoute() {
  const { user, isLoading } = useAuth();

  const handleUpdateUser = async (
    updates: Partial<{
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    }>,
  ) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      // Reload the page to get updated user data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Please log in to view settings</div>
      </div>
    );
  }

  return (
    <SettingsPage
      user={{
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationRole: user.organizationRole,
        companyName: user.organization.name,
      }}
      onUpdateUser={handleUpdateUser}
    />
  );
}
