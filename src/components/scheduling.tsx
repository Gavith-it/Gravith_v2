'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  Flag,
  AlertTriangle,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useScheduling } from '@/lib/contexts';
import { formatDate } from '@/lib/utils';
import type { ProjectActivity, ProjectMilestone } from '@/types';
import { toast } from 'sonner';

type SiteOption = { id: string; name: string };

const activitySchema = z.object({
  siteId: z.string().min(1, 'Select a site.'),
  siteName: z.string().optional(),
  name: z.string().min(2, 'Activity name is required.'),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  progress: z
    .number()
    .min(0, 'Progress cannot be negative.')
    .max(100, 'Progress cannot exceed 100%.'),
  status: z.enum(['not-started', 'in-progress', 'completed', 'delayed']),
  assignedTeam: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['Foundation', 'Structure', 'MEP', 'Finishing', 'External']),
  dependencies: z.string().optional(),
  resources: z.string().optional(),
  milestones: z.boolean().optional(),
});

const milestoneSchema = z.object({
  siteId: z.string().min(1, 'Select a site.'),
  siteName: z.string().optional(),
  name: z.string().min(2, 'Milestone name is required.'),
  date: z.date(),
  description: z.string().optional(),
  status: z.enum(['pending', 'achieved']),
});

type ActivityFormData = z.infer<typeof activitySchema>;
type MilestoneFormData = z.infer<typeof milestoneSchema>;

function deriveActivityStats(activities: ProjectActivity[]) {
  const total = activities.length;
  const completed = activities.filter((activity) => activity.status === 'completed').length;
  const inProgress = activities.filter((activity) => activity.status === 'in-progress').length;
  const delayed = activities.filter((activity) => activity.status === 'delayed').length;
  const averageProgress =
    activities.length > 0
      ? Math.round(
          activities.reduce((sum, activity) => sum + (activity.progress ?? 0), 0) / activities.length,
        )
      : 0;

  return {
    total,
    completed,
    inProgress,
    delayed,
    averageProgress,
  };
}

function groupActivitiesBySite(activities: ProjectActivity[]) {
  return activities.reduce<Record<string, ProjectActivity[]>>((acc, activity) => {
    if (!acc[activity.siteId]) {
      acc[activity.siteId] = [];
    }
    acc[activity.siteId].push(activity);
    return acc;
  }, {});
}

function findNextMilestone(milestones: ProjectMilestone[]) {
  const upcoming = milestones
    .filter((milestone) => milestone.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return upcoming[0] ?? null;
}

export function SchedulingPage({ filterBySite }: { filterBySite?: string } = {}) {
  const {
    activities,
    milestones,
    isLoading,
    addActivity,
    updateActivity,
    deleteActivity,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  } = useScheduling();

  const [isActivityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ProjectActivity | null>(null);
  const [isMilestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState<boolean>(false);

  const activityForm = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      siteId: '',
      siteName: '',
      name: '',
      description: '',
      startDate: undefined,
      endDate: undefined,
      progress: 0,
      status: 'not-started',
      assignedTeam: '',
      priority: 'medium',
      category: 'Foundation',
      dependencies: '',
      resources: '',
      milestones: false,
    },
  });

  const milestoneForm = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      siteId: '',
      siteName: '',
      name: '',
      description: '',
      date: undefined,
      status: 'pending',
    },
  });

  useEffect(() => {
    const loadSites = async () => {
      try {
        setIsLoadingSites(true);
        const response = await fetch('/api/sites', { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({}))) as {
          sites?: Array<{ id: string; name: string }>;
        };

        if (response.ok) {
          setSiteOptions(payload.sites ?? []);
        } else {
          setSiteOptions([]);
        }
      } catch (error) {
        console.error('Failed to load sites for scheduling', error);
        setSiteOptions([]);
      } finally {
        setIsLoadingSites(false);
      }
    };

    void loadSites();
  }, []);

  useEffect(() => {
    if (!isActivityDialogOpen) {
      activityForm.reset();
      setEditingActivity(null);
      return;
    }

    if (editingActivity) {
      activityForm.reset({
        siteId: editingActivity.siteId,
        siteName: editingActivity.siteName,
        name: editingActivity.name,
        description: editingActivity.description,
        startDate: editingActivity.startDate ? new Date(editingActivity.startDate) : undefined,
        endDate: editingActivity.endDate ? new Date(editingActivity.endDate) : undefined,
        progress: editingActivity.progress ?? 0,
        status: editingActivity.status,
        assignedTeam: editingActivity.assignedTeam,
        priority: editingActivity.priority,
        category: editingActivity.category,
        dependencies: editingActivity.dependencies?.join(', ') ?? '',
        resources: editingActivity.resources?.join(', ') ?? '',
        milestones: editingActivity.milestones ?? false,
      });
    } else if (filterBySite) {
      const siteMatch = siteOptions.find((site) => site.name === filterBySite);
      activityForm.setValue('siteId', siteMatch?.id ?? '');
      activityForm.setValue('siteName', siteMatch?.name ?? filterBySite);
    }
  }, [activityForm, editingActivity, filterBySite, isActivityDialogOpen, siteOptions]);

  useEffect(() => {
    if (!isMilestoneDialogOpen) {
      milestoneForm.reset();
      setEditingMilestone(null);
      return;
    }

    if (editingMilestone) {
      milestoneForm.reset({
        siteId: editingMilestone.siteId,
        siteName: siteOptions.find((site) => site.id === editingMilestone.siteId)?.name ?? '',
        name: editingMilestone.name,
        description: editingMilestone.description,
        date: editingMilestone.date ? new Date(editingMilestone.date) : undefined,
        status: editingMilestone.status,
      });
    } else if (filterBySite) {
      const siteMatch = siteOptions.find((site) => site.name === filterBySite);
      milestoneForm.setValue('siteId', siteMatch?.id ?? '');
      milestoneForm.setValue('siteName', siteMatch?.name ?? filterBySite);
    }
  }, [filterBySite, isMilestoneDialogOpen, milestoneForm, editingMilestone, siteOptions]);

  const filteredActivities = useMemo(() => {
    let result = activities;
    if (filterBySite) {
      result = result.filter((activity) => activity.siteName === filterBySite || activity.siteId === filterBySite);
    }
    return result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [activities, filterBySite]);

  const filteredMilestones = useMemo(() => {
    let result = milestones;
    if (filterBySite) {
      result = result.filter((milestone) => milestone.siteId === filterBySite);
    }
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [milestones, filterBySite]);

  const activityStats = useMemo(() => deriveActivityStats(filteredActivities), [filteredActivities]);
  const groupedActivities = useMemo(() => groupActivitiesBySite(filteredActivities), [filteredActivities]);
  const nextMilestone = useMemo(() => findNextMilestone(filteredMilestones), [filteredMilestones]);

  const handleActivitySubmit = async (data: ActivityFormData) => {
    try {
      const site = siteOptions.find((option) => option.id === data.siteId);
      const startDate = data.startDate;
      const endDate = data.endDate;

      if (endDate.getTime() < startDate.getTime()) {
        throw new Error('End date cannot be earlier than start date.');
      }

      const duration =
        Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 0;

      const payload = {
        siteId: data.siteId,
        siteName: site?.name ?? data.siteName ?? '',
        name: data.name,
        description: data.description ?? '',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        duration,
        progress: data.progress,
        status: data.status,
        dependencies:
          data.dependencies?.split(',').map((item) => item.trim()).filter(Boolean) ?? [],
        assignedTeam: data.assignedTeam ?? '',
        priority: data.priority,
        category: data.category,
        resources: data.resources?.split(',').map((item) => item.trim()).filter(Boolean) ?? [],
        milestones: Boolean(data.milestones),
      } satisfies Parameters<typeof addActivity>[0];

      if (editingActivity) {
        await updateActivity(editingActivity.id, payload);
        toast.success('Activity updated successfully');
      } else {
        await addActivity(payload);
        toast.success('Activity created successfully');
      }

      setActivityDialogOpen(false);
    } catch (error) {
      console.error('Failed to save activity', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save activity.');
    }
  };

  const handleMilestoneSubmit = async (data: MilestoneFormData) => {
    try {
      const site = siteOptions.find((option) => option.id === data.siteId);

      const payload = {
        siteId: data.siteId,
        name: data.name,
        date: data.date.toISOString().split('T')[0],
        description: data.description ?? '',
        status: data.status ?? 'pending',
        siteName: site?.name ?? data.siteName ?? '',
      } satisfies Parameters<typeof addMilestone>[0];

      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, payload);
        toast.success('Milestone updated successfully');
      } else {
        await addMilestone(payload);
        toast.success('Milestone created successfully');
      }

      setMilestoneDialogOpen(false);
    } catch (error) {
      console.error('Failed to save milestone', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save milestone.');
    }
  };

  const handleActivityDelete = async (activity: ProjectActivity) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete activity "${activity.name}"?`);
      if (!confirmed) return;
    }

    try {
      await deleteActivity(activity.id);
      toast.success('Activity deleted');
    } catch (error) {
      console.error('Failed to delete activity', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete activity.');
    }
  };

  const handleMilestoneDelete = async (milestone: ProjectMilestone) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete milestone "${milestone.name}"?`);
      if (!confirmed) return;
    }

    try {
      await deleteMilestone(milestone.id);
      toast.success('Milestone deleted');
    } catch (error) {
      console.error('Failed to delete milestone', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete milestone.');
    }
  };

  const criticalActivities = useMemo(
    () =>
      filteredActivities.filter(
        (activity) => activity.priority === 'critical' || activity.milestones === true,
      ),
    [filteredActivities],
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scheduling</h1>
          <p className="text-muted-foreground">
            Plan activities, track milestones, and monitor progress across sites.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setMilestoneDialogOpen(true)} variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Add Milestone
          </Button>
          <Button onClick={() => setActivityDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Activity
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activityStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{activityStats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{activityStats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-2xl font-bold text-red-600">{activityStats.delayed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <p className="text-3xl font-semibold">{activityStats.averageProgress}%</p>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${activityStats.averageProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Average completion across filtered activities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activities Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No activities found{filterBySite ? ` for ${filterBySite}` : ''}.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([siteId, siteActivities]) => {
                const siteName =
                  siteOptions.find((site) => site.id === siteId)?.name ||
                  siteActivities[0]?.siteName ||
                  'Unknown site';

                return (
                  <div key={siteId} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {siteName}
                    </h3>
                    <div className="space-y-3">
                      {siteActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold">{activity.name}</h4>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase text-muted-foreground">
                                  {activity.category}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs uppercase ${
                                    activity.priority === 'critical'
                                      ? 'bg-red-100 text-red-700'
                                      : activity.priority === 'high'
                                        ? 'bg-orange-100 text-orange-700'
                                        : activity.priority === 'medium'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {activity.priority}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {activity.description || 'No description provided.'}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span>
                                  <Calendar className="mr-1 inline h-3 w-3" />
                                  {formatDate(activity.startDate)} → {formatDate(activity.endDate)} (
                                  {activity.duration} days)
                                </span>
                                <span>
                                  <Users className="mr-1 inline h-3 w-3" />
                                  {activity.assignedTeam || 'Unassigned'}
                                </span>
                                <span>
                                  <Flag className="mr-1 inline h-3 w-3" />
                                  {activity.status.replace('-', ' ')}
                                </span>
                              </div>
                              <div className="mt-3 h-2 rounded-full bg-muted">
                                <div
                                  className={`h-2 rounded-full ${
                                    activity.status === 'completed'
                                      ? 'bg-green-500'
                                      : activity.status === 'delayed'
                                        ? 'bg-red-500'
                                        : 'bg-primary'
                                  }`}
                                  style={{ width: `${activity.progress}%` }}
                                />
                              </div>
                              {activity.resources?.length ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Resources: {activity.resources.join(', ')}
                                </p>
                              ) : null}
                              {activity.dependencies?.length ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Dependencies: {activity.dependencies.join(', ')}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setEditingActivity(activity);
                                  setActivityDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleActivityDelete(activity)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMilestones.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No milestones recorded{filterBySite ? ` for ${filterBySite}` : ''}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMilestones.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell className="font-medium">{milestone.name}</TableCell>
                    <TableCell>{formatDate(milestone.date)}</TableCell>
                    <TableCell className="capitalize">{milestone.status}</TableCell>
                    <TableCell>{milestone.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingMilestone(milestone);
                            setMilestoneDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleMilestoneDelete(milestone)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Critical Path</CardTitle>
        </CardHeader>
        <CardContent>
          {criticalActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No critical activities identified. Mark important tasks as critical to track them here.
            </p>
          ) : (
            <ul className="space-y-3">
              {criticalActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-start justify-between rounded-lg border bg-card p-4 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold">{activity.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(activity.startDate)} → {formatDate(activity.endDate)} ·{' '}
                      {activity.duration} days
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Site: {activity.siteName || 'Unknown'}
                    </p>
                  </div>
                  <Badge variant={activity.milestones ? 'default' : 'secondary'}>
                    {activity.milestones ? 'Milestone' : 'Critical Task'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Milestone</CardTitle>
        </CardHeader>
        <CardContent>
          {nextMilestone ? (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold">{nextMilestone.name}</p>
                <p className="text-sm text-muted-foreground">
                  Due on {formatDate(nextMilestone.date)}
                </p>
              </div>
              <Badge variant={nextMilestone.status === 'pending' ? 'secondary' : 'default'}>
                {nextMilestone.status}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pending milestones.</p>
          )}
        </CardContent>
      </Card>

      {/* Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
            <DialogDescription>
              {editingActivity
                ? 'Update the details of the activity.'
                : 'Create a new project activity.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...activityForm}>
            <form onSubmit={activityForm.handleSubmit(handleActivitySubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={activityForm.control}
                  name="siteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const site = siteOptions.find((option) => option.id === value);
                          activityForm.setValue('siteName', site?.name ?? '');
                        }}
                        disabled={isLoadingSites || siteOptions.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingSites
                                  ? 'Loading sites…'
                                  : siteOptions.length === 0
                                    ? 'No sites available'
                                    : 'Select site'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteOptions.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={activityForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Foundation Concrete" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={activityForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Describe the activity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={activityForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value ?? undefined} onSelect={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={activityForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date *</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value ?? undefined} onSelect={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={activityForm.control}
                  name="assignedTeam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Team</FormLabel>
                      <FormControl>
                        <Input placeholder="Concrete Team" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={activityForm.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={activityForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not-started">Not started</SelectItem>
                          <SelectItem value="in-progress">In progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={activityForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={activityForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Foundation">Foundation</SelectItem>
                          <SelectItem value="Structure">Structure</SelectItem>
                          <SelectItem value="MEP">MEP</SelectItem>
                          <SelectItem value="Finishing">Finishing</SelectItem>
                          <SelectItem value="External">External</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={activityForm.control}
                  name="dependencies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dependencies</FormLabel>
                      <FormControl>
                        <Input placeholder="ACT-101, ACT-102" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={activityForm.control}
                  name="resources"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resources</FormLabel>
                      <FormControl>
                        <Input placeholder="Crane, Labor Team" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={activityForm.control}
                name="milestones"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel className="mt-0">Marks a milestone</FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setActivityDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingActivity ? 'Save Changes' : 'Create Activity'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={isMilestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
            <DialogDescription>
              {editingMilestone
                ? 'Update the details of the milestone.'
                : 'Create a new project milestone.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...milestoneForm}>
            <form onSubmit={milestoneForm.handleSubmit(handleMilestoneSubmit)} className="space-y-4">
              <FormField
                control={milestoneForm.control}
                name="siteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const site = siteOptions.find((option) => option.id === value);
                        milestoneForm.setValue('siteName', site?.name ?? '');
                      }}
                      disabled={isLoadingSites || siteOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoadingSites
                                ? 'Loading sites…'
                                : siteOptions.length === 0
                                  ? 'No sites available'
                                  : 'Select site'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siteOptions.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={milestoneForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Foundation Complete" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={milestoneForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Describe the milestone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={milestoneForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <DatePicker date={field.value ?? undefined} onSelect={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={milestoneForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="achieved">Achieved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMilestoneDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingMilestone ? 'Save Changes' : 'Create Milestone'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

