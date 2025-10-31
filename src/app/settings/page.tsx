'use client';

import { SettingsPage } from '@/components/settings';

// Mock data for settings page
const mockUser = {
  username: 'admin',
  role: 'admin' as const,
  companyName: 'Gavith Construction Pvt. Ltd.',
};

export default function SettingsPageRoute() {
  const handleUpdateUser = (
    updates: Partial<{ username: string; role: string; companyName: string }>,
  ) => {
    console.log('User updated:', updates);
    // In a real app, this would make an API call
  };

  return <SettingsPage user={mockUser} onUpdateUser={handleUpdateUser} />;
}
