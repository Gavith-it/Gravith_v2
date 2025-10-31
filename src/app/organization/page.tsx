'use client';

import { OrganizationPage } from '@/components/organization';

// Mock data for organization page
const mockUsers = [
  {
    id: 'user1',
    username: 'admin',
    email: 'admin@gavithconstruction.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const,
    organizationId: 'org1',
    organizationRole: 'owner' as const,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    organization: {
      id: 'org1',
      name: 'Gavith Construction Pvt. Ltd.',
      subscription: 'premium' as const,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'system',
    },
  },
];

const mockOrganizations = [
  {
    id: 'org1',
    name: 'Gavith Construction Pvt. Ltd.',
    subscription: 'premium' as const,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
  },
];

export default function OrganizationPageRoute() {
  return (
    <OrganizationPage
      currentUser={mockUsers[0]}
      currentOrganization={mockOrganizations[0]}
      onUpdateOrganization={() => {}}
    />
  );
}
