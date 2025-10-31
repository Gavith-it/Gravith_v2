'use client';

import {
  Plus,
  Calendar,
  AlertTriangle,
  Target,
  Users,
  Activity,
  Zap,
  Building2,
} from 'lucide-react';
import React, { useState } from 'react';

import { useDialogState } from '../lib/hooks/useDialogState';
import { useTableState } from '../lib/hooks/useTableState';
import { formatDate } from '../lib/utils';

import { DataTable } from './common/DataTable';
import { FormDialog } from './common/FormDialog';
import { PageHeader } from './layout/PageHeader';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DatePicker } from './ui/date-picker';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface ProjectActivity {
  id: string;
  siteId: string;
  siteName: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  progress: number; // percentage
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
  dependencies: string[]; // array of activity IDs
  assignedTeam: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'Foundation' | 'Structure' | 'MEP' | 'Finishing' | 'External';
  resources: string[];
  milestones: boolean;
}

interface ProjectMilestone {
  id: string;
  name: string;
  date: string;
  description: string;
  status: 'pending' | 'achieved';
}

interface Site {
  id: string;
  name: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  status: 'Active' | 'Stopped' | 'Completed' | 'Canceled';
  budget: number;
  spent: number;
  description: string;
  progress: number;
}

const mockSites: Site[] = [
  {
    id: '1',
    name: 'Residential Complex A',
    location: 'Downtown District',
    startDate: '2024-01-15',
    expectedEndDate: '2024-12-30',
    status: 'Active',
    budget: 25000000,
    spent: 8500000,
    description: 'High-rise residential building with 200 units',
    progress: 34,
  },
  {
    id: '2',
    name: 'Commercial Plaza B',
    location: 'Business District',
    startDate: '2024-02-01',
    expectedEndDate: '2025-06-15',
    status: 'Active',
    budget: 45000000,
    spent: 12500000,
    description: 'Mixed-use commercial development',
    progress: 28,
  },
  {
    id: '3',
    name: 'Industrial Warehouse C',
    location: 'Industrial Zone',
    startDate: '2024-03-10',
    expectedEndDate: '2024-11-20',
    status: 'Active',
    budget: 18000000,
    spent: 5200000,
    description: 'Large-scale warehouse facility',
    progress: 29,
  },
];

const mockActivities: ProjectActivity[] = [
  {
    id: '1',
    siteId: '1',
    siteName: 'Residential Complex A',
    name: 'Site Preparation',
    description: 'Clear site, set up temporary facilities, survey',
    startDate: '2024-01-15',
    endDate: '2024-01-25',
    duration: 10,
    progress: 100,
    status: 'completed',
    dependencies: [],
    assignedTeam: 'Site Team A',
    priority: 'high',
    category: 'Foundation',
    resources: ['Excavator', 'Labor Team'],
    milestones: false,
  },
  {
    id: '2',
    siteId: '1',
    siteName: 'Residential Complex A',
    name: 'Foundation Excavation',
    description: 'Excavate foundation as per drawings',
    startDate: '2024-01-26',
    endDate: '2024-02-05',
    duration: 10,
    progress: 100,
    status: 'completed',
    dependencies: ['1'],
    assignedTeam: 'Foundation Team',
    priority: 'critical',
    category: 'Foundation',
    resources: ['Excavator', 'Dumper', 'Labor Team'],
    milestones: false,
  },
  {
    id: '3',
    siteId: '1',
    siteName: 'Residential Complex A',
    name: 'Foundation Concrete',
    description: 'Pour foundation concrete and curing',
    startDate: '2024-02-06',
    endDate: '2024-02-20',
    duration: 14,
    progress: 85,
    status: 'in-progress',
    dependencies: ['2'],
    assignedTeam: 'Concrete Team',
    priority: 'critical',
    category: 'Foundation',
    resources: ['Concrete Mixer', 'Crane', 'Labor Team'],
    milestones: true,
  },
  {
    id: '4',
    siteId: '1',
    siteName: 'Residential Complex A',
    name: 'Column Construction',
    description: 'Construct ground floor columns',
    startDate: '2024-02-21',
    endDate: '2024-03-10',
    duration: 18,
    progress: 0,
    status: 'not-started',
    dependencies: ['3'],
    assignedTeam: 'Structure Team',
    priority: 'high',
    category: 'Structure',
    resources: ['Crane', 'Concrete Mixer', 'Labor Team'],
    milestones: false,
  },
  {
    id: '5',
    siteId: '1',
    siteName: 'Residential Complex A',
    name: 'First Floor Slab',
    description: 'Cast first floor slab',
    startDate: '2024-03-11',
    endDate: '2024-03-25',
    duration: 14,
    progress: 0,
    status: 'not-started',
    dependencies: ['4'],
    assignedTeam: 'Structure Team',
    priority: 'high',
    category: 'Structure',
    resources: ['Crane', 'Concrete Mixer', 'Labor Team'],
    milestones: true,
  },
  {
    id: '6',
    siteId: '2',
    siteName: 'Commercial Plaza B',
    name: 'Site Survey',
    description: 'Complete site survey and measurements',
    startDate: '2024-02-01',
    endDate: '2024-02-10',
    duration: 9,
    progress: 100,
    status: 'completed',
    dependencies: [],
    assignedTeam: 'Survey Team',
    priority: 'high',
    category: 'Foundation',
    resources: ['Survey Equipment', 'GPS Device'],
    milestones: false,
  },
  {
    id: '7',
    siteId: '3',
    siteName: 'Industrial Warehouse C',
    name: 'Ground Preparation',
    description: 'Level ground and prepare for construction',
    startDate: '2024-03-10',
    endDate: '2024-03-20',
    duration: 10,
    progress: 60,
    status: 'in-progress',
    dependencies: [],
    assignedTeam: 'Ground Team',
    priority: 'medium',
    category: 'Foundation',
    resources: ['Bulldozer', 'Compactor', 'Labor Team'],
    milestones: false,
  },
];

const mockMilestones: ProjectMilestone[] = [
  {
    id: '1',
    name: 'Foundation Complete',
    date: '2024-02-20',
    description: 'Foundation work completed and approved',
    status: 'pending',
  },
  {
    id: '2',
    name: 'Ground Floor Complete',
    date: '2024-03-25',
    description: 'Ground floor structure completed',
    status: 'pending',
  },
];

interface SchedulingPageProps {
  filterBySite?: string;
}

export function SchedulingPage({ filterBySite }: SchedulingPageProps = {}) {
  const [sites] = useState<Site[]>(mockSites);
  const [activities, setActivities] = useState<ProjectActivity[]>(mockActivities);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(mockMilestones);
  const [selectedView, setSelectedView] = useState<'gantt' | 'timeline' | 'critical'>('gantt');

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'name',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  const activityDialog = useDialogState<ProjectActivity>();
  const milestoneDialog = useDialogState<ProjectMilestone>();

  const [activityForm, setActivityForm] = useState({
    siteId: '',
    name: '',
    description: '',
    startDate: '',
    duration: '',
    assignedTeam: '',
    priority: 'medium' as ProjectActivity['priority'],
    category: 'Foundation' as ProjectActivity['category'],
    dependencies: [] as string[],
    resources: '',
    milestones: false,
  });

  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    date: '',
    description: '',
  });

  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date(activityForm.startDate);
    const endDate = new Date(
      startDate.getTime() + Number(activityForm.duration) * 24 * 60 * 60 * 1000,
    );

    // Use filterBySite if provided, otherwise use form siteId
    const effectiveSiteId = filterBySite
      ? sites.find((s) => s.name === filterBySite)?.id || '1'
      : activityForm.siteId;
    const selectedSite = sites.find(
      (site) => site.id === effectiveSiteId || site.name === filterBySite,
    );

    const newActivity: ProjectActivity = {
      id: (activities.length + 1).toString(),
      siteId: effectiveSiteId,
      siteName: filterBySite || selectedSite?.name || '',
      name: activityForm.name,
      description: activityForm.description,
      startDate: activityForm.startDate,
      endDate: endDate.toISOString().split('T')[0],
      duration: Number(activityForm.duration),
      progress: 0,
      status: 'not-started',
      dependencies: activityForm.dependencies,
      assignedTeam: activityForm.assignedTeam,
      priority: activityForm.priority,
      category: activityForm.category,
      resources: activityForm.resources.split(',').map((r) => r.trim()),
      milestones: activityForm.milestones,
    };

    setActivities((prev) => [...prev, newActivity]);
    setActivityForm({
      siteId: '',
      name: '',
      description: '',
      startDate: '',
      duration: '',
      assignedTeam: '',
      priority: 'medium',
      category: 'Foundation',
      dependencies: [],
      resources: '',
      milestones: false,
    });
    activityDialog.closeDialog();
  };

  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newMilestone: ProjectMilestone = {
      id: (milestones.length + 1).toString(),
      name: milestoneForm.name,
      date: milestoneForm.date,
      description: milestoneForm.description,
      status: 'pending',
    };

    setMilestones((prev) => [...prev, newMilestone]);
    setMilestoneForm({ name: '', date: '', description: '' });
    milestoneDialog.closeDialog();
  };

  const getStatusColor = (status: ProjectActivity['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: ProjectActivity['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCriticalPath = (activityList: ProjectActivity[]) => {
    // Simple critical path calculation - in real app would use proper algorithm
    const sortedActivities = [...activityList].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    return sortedActivities.filter(
      (activity) => activity.priority === 'critical' || activity.milestones,
    );
  };

  const getGanttData = (activityList: ProjectActivity[]) => {
    if (activityList.length === 0) return [];
    const startDate = new Date(
      Math.min(...activityList.map((a) => new Date(a.startDate).getTime())),
    );
    const endDate = new Date(Math.max(...activityList.map((a) => new Date(a.endDate).getTime())));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return activityList.map((activity) => {
      const activityStart = new Date(activity.startDate);
      const activityEnd = new Date(activity.endDate);
      const startOffset = Math.ceil(
        (activityStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const width = Math.ceil(
        (activityEnd.getTime() - activityStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        ...activity,
        startOffset: (startOffset / totalDays) * 100,
        width: (width / totalDays) * 100,
      };
    });
  };

  // Filter activities by site if applicable
  const filteredActivities = filterBySite
    ? activities.filter((a) => a.siteName === filterBySite)
    : activities;

  const ganttData = getGanttData(filteredActivities);
  const criticalPath = getCriticalPath(filteredActivities);
  const completedActivities = filteredActivities.filter((a) => a.status === 'completed').length;
  const totalActivities = filteredActivities.length;
  const projectProgress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex justify-end gap-2">
        <div className="flex gap-2">
          <FormDialog
            title="Add Project Milestone"
            description="Create a key milestone for the project"
            isOpen={milestoneDialog.isDialogOpen}
            onOpenChange={(open) => {
              if (open) {
                milestoneDialog.openDialog();
              } else {
                milestoneDialog.closeDialog();
              }
            }}
            maxWidth="max-w-2xl"
            trigger={
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            }
          >
            <form onSubmit={handleMilestoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Milestone Name</Label>
                <Input
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Foundation Complete"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Target Date</Label>
                <DatePicker
                  date={milestoneForm.date ? new Date(milestoneForm.date) : undefined}
                  onSelect={(date) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      date: date ? date.toISOString().split('T')[0] : '',
                    }))
                  }
                  placeholder="Select target date"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={milestoneForm.description}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Milestone description..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => milestoneDialog.closeDialog()}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Milestone</Button>
              </div>
            </form>
          </FormDialog>

          <FormDialog
            title="Add Project Activity"
            description="Create a new activity in the project schedule"
            isOpen={activityDialog.isDialogOpen}
            onOpenChange={(open) => {
              if (open) {
                activityDialog.openDialog();
              } else {
                activityDialog.closeDialog();
              }
            }}
            maxWidth="max-w-2xl"
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            }
          >
            <form onSubmit={handleActivitySubmit} className="space-y-4">
              {/* Site Selection */}
              {!filterBySite && (
                <div className="space-y-2">
                  <Label htmlFor="siteId">Site *</Label>
                  <Select
                    value={activityForm.siteId}
                    onValueChange={(value) => {
                      setActivityForm((prev) => ({ ...prev, siteId: value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites
                        .filter((site) => site.status === 'Active')
                        .map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{site.name}</div>
                                <div className="text-sm text-gray-500">{site.location}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activity Name</Label>
                  <Input
                    value={activityForm.name}
                    onChange={(e) => setActivityForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Foundation Excavation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={activityForm.category}
                    onValueChange={(value) =>
                      setActivityForm((prev) => ({
                        ...prev,
                        category: value as ProjectActivity['category'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Foundation">Foundation</SelectItem>
                      <SelectItem value="Structure">Structure</SelectItem>
                      <SelectItem value="MEP">MEP</SelectItem>
                      <SelectItem value="Finishing">Finishing</SelectItem>
                      <SelectItem value="External">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={activityForm.description}
                  onChange={(e) =>
                    setActivityForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Detailed activity description..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <DatePicker
                    date={activityForm.startDate ? new Date(activityForm.startDate) : undefined}
                    onSelect={(date) =>
                      setActivityForm((prev) => ({
                        ...prev,
                        startDate: date ? date.toISOString().split('T')[0] : '',
                      }))
                    }
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (Days)</Label>
                  <Input
                    type="number"
                    value={activityForm.duration}
                    onChange={(e) =>
                      setActivityForm((prev) => ({ ...prev, duration: e.target.value }))
                    }
                    placeholder="10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={activityForm.priority}
                    onValueChange={(value) =>
                      setActivityForm((prev) => ({
                        ...prev,
                        priority: value as ProjectActivity['priority'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned Team</Label>
                  <Input
                    value={activityForm.assignedTeam}
                    onChange={(e) =>
                      setActivityForm((prev) => ({ ...prev, assignedTeam: e.target.value }))
                    }
                    placeholder="Foundation Team"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resources (comma-separated)</Label>
                  <Input
                    value={activityForm.resources}
                    onChange={(e) =>
                      setActivityForm((prev) => ({ ...prev, resources: e.target.value }))
                    }
                    placeholder="Excavator, Dumper, Labor Team"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="milestone"
                  checked={activityForm.milestones}
                  onChange={(e) =>
                    setActivityForm((prev) => ({ ...prev, milestones: e.target.checked }))
                  }
                  className="rounded"
                />
                <Label htmlFor="milestone">Mark as milestone activity</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => activityDialog.closeDialog()}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Activity</Button>
              </div>
            </form>
          </FormDialog>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-semibold">{totalActivities}</p>
                <p className="text-xs text-muted-foreground">{completedActivities} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-semibold">{projectProgress.toFixed(0)}%</p>
                <Progress value={projectProgress} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Critical Path</p>
                <p className="text-2xl font-semibold">{criticalPath.length}</p>
                <p className="text-xs text-orange-600">activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Milestones</p>
                <p className="text-2xl font-semibold">{milestones.length}</p>
                <p className="text-xs text-purple-600">planned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Selector */}
      <div className="flex items-center gap-2">
        <Button
          variant={selectedView === 'gantt' ? 'default' : 'outline'}
          onClick={() => setSelectedView('gantt')}
        >
          Gantt Chart
        </Button>
        <Button
          variant={selectedView === 'timeline' ? 'default' : 'outline'}
          onClick={() => setSelectedView('timeline')}
        >
          Timeline View
        </Button>
        <Button
          variant={selectedView === 'critical' ? 'default' : 'outline'}
          onClick={() => setSelectedView('critical')}
        >
          Critical Path
        </Button>
      </div>

      {selectedView === 'gantt' && (
        <Card>
          <CardHeader>
            <CardTitle>Gantt Chart View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ganttData.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-2 border rounded">
                  <div className="w-48 text-sm">
                    <div className="font-medium">{activity.name}</div>
                    <div className="text-xs text-muted-foreground">{activity.assignedTeam}</div>
                  </div>
                  <div className="flex-1 relative h-8 bg-gray-100 rounded">
                    <div
                      className={`absolute h-full rounded ${
                        activity.status === 'completed'
                          ? 'bg-green-500'
                          : activity.status === 'in-progress'
                            ? 'bg-blue-500'
                            : activity.status === 'delayed'
                              ? 'bg-red-500'
                              : 'bg-gray-300'
                      }`}
                      style={{
                        left: `${activity.startOffset}%`,
                        width: `${activity.width}%`,
                      }}
                    >
                      <div className="px-2 py-1 text-xs text-white">{activity.progress}%</div>
                    </div>
                    {activity.milestones && (
                      <div
                        className="absolute top-0 bottom-0 w-2 bg-yellow-500 rounded-full"
                        style={{ left: `${activity.startOffset + activity.width}%` }}
                      />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                    <Badge className={getPriorityColor(activity.priority)}>
                      {activity.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedView === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Activities Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'activity', label: 'Activity', sortable: true },
                { key: 'category', label: 'Category', sortable: true },
                { key: 'schedule', label: 'Schedule', sortable: true },
                { key: 'team', label: 'Team', sortable: true },
                { key: 'progress', label: 'Progress', sortable: true },
                { key: 'status', label: 'Status', sortable: true },
              ]}
              data={filteredActivities.map((activity) => ({
                activity: (
                  <div>
                    <div className="flex items-center gap-2">
                      {activity.milestones && <Target className="h-4 w-4 text-yellow-600" />}
                      <span className="font-medium">{activity.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.description}</div>
                  </div>
                ),
                category: <Badge variant="outline">{activity.category}</Badge>,
                schedule: (
                  <div className="text-sm">
                    <div>
                      {formatDate(activity.startDate)} - {formatDate(activity.endDate)}
                    </div>
                    <div className="text-muted-foreground">{activity.duration} days</div>
                  </div>
                ),
                team: (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    {activity.assignedTeam}
                  </div>
                ),
                progress: (
                  <div className="space-y-1">
                    <Progress value={activity.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">{activity.progress}%</div>
                  </div>
                ),
                status: (
                  <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                ),
              }))}
              onSort={tableState.setSortField}
              onPageChange={tableState.setCurrentPage}
              pageSize={tableState.itemsPerPage}
              currentPage={tableState.currentPage}
              totalPages={tableState.totalPages(filteredActivities.length)}
              sortField={tableState.sortField}
              sortDirection={tableState.sortDirection}
            />
          </CardContent>
        </Card>
      )}

      {selectedView === 'critical' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                Critical Path Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These activities are critical to the project timeline. Any delays will impact the
                  overall project completion date.
                </AlertDescription>
              </Alert>
              <div className="mt-4 space-y-3">
                {criticalPath.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 border border-orange-200 rounded-lg bg-orange-50"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{activity.name}</span>
                        {activity.milestones && <Target className="h-4 w-4 text-yellow-600" />}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(activity.startDate)} - {formatDate(activity.endDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{activity.progress}% complete</div>
                      <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{milestone.name}</div>
                      <div className="text-sm text-muted-foreground">{milestone.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatDate(milestone.date)}</div>
                      <Badge variant={milestone.status === 'achieved' ? 'default' : 'secondary'}>
                        {milestone.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
