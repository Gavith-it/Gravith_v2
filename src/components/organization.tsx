'use client';

import {
  Settings,
  Users,
  CreditCard,
  Shield,
  Building2,
  Calendar,
  Crown,
  User,
  UserCheck,
  Loader2,
  Mail,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { formatDate } from '../lib/utils';
import type { UserWithOrganization, Organization } from '../types';

import { FormDialog } from './common/FormDialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import { createClient } from '@/lib/supabase/client';

interface OrganizationManagementProps {
  currentUser: UserWithOrganization;
  currentOrganization: Organization;
  onUpdateOrganization: (updates: Partial<Organization>) => void;
}

interface OrganizationMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string;
  organization_role: UserWithOrganization['organizationRole'];
  is_active: boolean;
}

export function OrganizationPage({
  currentUser,
  currentOrganization,
  onUpdateOrganization,
}: OrganizationManagementProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentOrganization.name);

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }, []);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationMember['organization_role']>('user');
  const [isInviting, setIsInviting] = useState(false);

  const fallbackMembers = useMemo<OrganizationMember[]>(() => {
    const primaryMember: OrganizationMember = {
      id: currentUser.id,
      email: currentUser.email,
      first_name: currentUser.firstName ?? null,
      last_name: currentUser.lastName ?? null,
      username: currentUser.username,
      organization_role: currentUser.organizationRole,
      is_active: currentUser.isActive,
    };

    const sampleMembers: OrganizationMember[] = [
      {
        id: 'mock-member-1',
        email: 'project.lead@gavith.com',
        first_name: 'Priya',
        last_name: 'Sharma',
        username: 'priya.sharma',
        organization_role: 'manager',
        is_active: true,
      },
      {
        id: 'mock-member-2',
        email: 'finance.team@gavith.com',
        first_name: 'Rahul',
        last_name: 'Verma',
        username: 'rahul.verma',
        organization_role: 'finance-manager',
        is_active: true,
      },
    ];

    return [primaryMember, ...sampleMembers];
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      if (!supabase) {
        if (isMounted) {
          setMembers(fallbackMembers);
          setIsMembersLoading(false);
        }
        return;
      }

      setIsMembersLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, username, organization_role, is_active')
          .eq('organization_id', currentOrganization.id)
          .order('created_at', { ascending: true });

        if (!isMounted) return;

        if (error) {
          console.error('Error fetching organization members:', error);
          toast.error('Failed to load organization members.');
          setMembers(fallbackMembers);
        } else {
          setMembers(
            (data as OrganizationMember[])?.length
              ? (data as OrganizationMember[])
              : fallbackMembers,
          );
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Unexpected error fetching members:', error);
        toast.error('Failed to load organization members.');
        setMembers(fallbackMembers);
      }
      setIsMembersLoading(false);
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [supabase, currentOrganization.id, fallbackMembers, toast]);

  const refreshMembers = async () => {
    if (!supabase) {
      setMembers(fallbackMembers);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, username, organization_role, is_active')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error refreshing organization members:', error);
        toast.error('Failed to refresh members list.');
        setMembers(fallbackMembers);
        return;
      }

      setMembers(
        (data as OrganizationMember[])?.length ? (data as OrganizationMember[]) : fallbackMembers,
      );
    } catch (error) {
      console.error('Unexpected error refreshing organization members:', error);
      toast.error('Failed to refresh members list.');
      setMembers(fallbackMembers);
    }
  };

  const handleInviteMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address.');
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch('/api/organization/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to send invite.');
        return;
      }

      toast.success('Invitation sent successfully.');
      setInviteEmail('');
      setInviteRole('user');
      setInviteDialogOpen(false);
      await refreshMembers();
    } catch (error) {
      console.error('Unexpected error sending invite:', error);
      toast.error('Unexpected error while inviting member.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== currentOrganization.name) {
      onUpdateOrganization({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(currentOrganization.name);
    setIsEditingName(false);
  };

  const getSubscriptionBadgeVariant = (subscription: string) => {
    switch (subscription) {
      case 'enterprise':
        return 'default';
      case 'premium':
        return 'secondary';
      case 'basic':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'manager':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return Shield;
      case 'manager':
        return UserCheck;
      default:
        return User;
    }
  };

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Tabs - Topmost */}
        <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
          <CardContent className="px-6 py-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <TabsContent value="overview" className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Organization Details */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Organization Name</Label>
                    {isEditingName ? (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1"
                          placeholder="Organization name"
                        />
                        <Button size="sm" onClick={handleSaveName}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{currentOrganization.name}</p>
                        {(currentUser.organizationRole === 'owner' ||
                          currentUser.organizationRole === 'admin') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingName(true)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Subscription Plan</Label>
                    <div className="mt-2">
                      <Badge
                        variant={getSubscriptionBadgeVariant(
                          currentOrganization.subscription || 'free',
                        )}
                        className="capitalize"
                      >
                        {currentOrganization.subscription || 'Free'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Status</Label>
                    <div className="mt-2">
                      <Badge variant={currentOrganization.isActive ? 'default' : 'destructive'}>
                        {currentOrganization.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Created</Label>
                    <div className="mt-2 flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {formatDate(currentOrganization.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Your Role */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(getRoleIcon(currentUser.organizationRole), {
                      className: 'h-5 w-5 text-blue-600',
                    })}
                    Your Role & Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Role</Label>
                    <div className="mt-2">
                      <Badge
                        variant={getRoleBadgeVariant(currentUser.organizationRole)}
                        className="capitalize"
                      >
                        {currentUser.organizationRole}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Email</Label>
                    <p className="mt-2 text-slate-900">{currentUser.email}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Member Since</Label>
                    <div className="mt-2 flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {formatDate(currentUser.createdAt)}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Permissions</Label>
                    <div className="mt-2 space-y-1">
                      {currentUser.organizationRole === 'owner' && (
                        <div className="text-sm text-slate-600">• Full organization access</div>
                      )}
                      {(currentUser.organizationRole === 'owner' ||
                        currentUser.organizationRole === 'admin') && (
                        <>
                          <div className="text-sm text-slate-600">
                            • Manage organization settings
                          </div>
                          <div className="text-sm text-slate-600">• Invite and manage members</div>
                        </>
                      )}
                      <div className="text-sm text-slate-600">• Access all projects and data</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Organization Members
                  </CardTitle>
                  {(currentUser.organizationRole === 'owner' ||
                    currentUser.organizationRole === 'admin') && (
                    <Button onClick={() => setInviteDialogOpen(true)}>Invite Member</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isMembersLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>Loading members...</p>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No members found</p>
                    <p className="text-sm mt-1">Invite team members to collaborate on projects.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => {
                      const isCurrentUser = member.id === currentUser.id;
                      const displayName =
                        member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.username;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                              {(member.first_name?.[0] || member.username[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {displayName}{' '}
                                {isCurrentUser && <span className="text-blue-600">(You)</span>}
                              </p>
                              <p className="text-sm text-slate-600">{member.email}</p>
                              {!member.is_active && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  Invitation pending
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={getRoleBadgeVariant(member.organization_role)}
                            className="capitalize"
                          >
                            {member.organization_role}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Subscription & Billing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 capitalize">
                          {currentOrganization.subscription || 'Free'} Plan
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Current subscription plan for your organization
                        </p>
                      </div>
                      <Button variant="outline">Upgrade Plan</Button>
                    </div>
                  </div>

                  <div className="text-center py-8 text-slate-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Billing management coming soon</p>
                    <p className="text-sm mt-1">
                      Advanced subscription features will be available in a future update
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Organization Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-8 text-slate-500">
                    <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Advanced settings coming soon</p>
                    <p className="text-sm mt-1">
                      Additional organization configuration options will be available in future
                      updates
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <FormDialog
        title="Invite a Member"
        isOpen={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        maxWidth="sm:max-w-lg"
      >
        <form className="space-y-4" onSubmit={handleInviteMember}>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              required
              placeholder="person@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as OrganizationMember['organization_role'])
              }
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="project-manager">Project Manager</option>
              <option value="site-supervisor">Site Supervisor</option>
              <option value="materials-manager">Materials Manager</option>
              <option value="finance-manager">Finance Manager</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}
