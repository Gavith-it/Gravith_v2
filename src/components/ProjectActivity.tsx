'use client';

import {
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Target,
  Users,
  Activity,
  Zap,
  Building2,
  MapPin,
  Edit,
  Trash2,
  Search,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { PageHeader } from './layout/PageHeader';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DatePicker } from './ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

// Interface for Project Activity
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
  category:
    | 'Foundation'
    | 'Structure'
    | 'MEP'
    | 'Finishing'
    | 'External'
    | 'Planning'
    | 'Quality Control';
  resources: string[];
  milestones: boolean;
  estimatedCost: number;
  actualCost: number;
  createdDate: string;
  lastUpdated: string;
}

// Interface for Site (from SiteManagement)
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

// Mock sites data (in real app, this would come from props or context)
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

// Mock activities data
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
    estimatedCost: 50000,
    actualCost: 48000,
    createdDate: '2024-01-10',
    lastUpdated: '2024-01-25',
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
    estimatedCost: 75000,
    actualCost: 72000,
    createdDate: '2024-01-15',
    lastUpdated: '2024-02-05',
  },
  {
    id: '3',
    siteId: '2',
    siteName: 'Commercial Plaza B',
    name: 'Structural Framework',
    description: 'Erect steel framework for commercial building',
    startDate: '2024-02-06',
    endDate: '2024-02-20',
    duration: 14,
    progress: 85,
    status: 'in-progress',
    dependencies: [],
    assignedTeam: 'Structure Team',
    priority: 'critical',
    category: 'Structure',
    resources: ['Crane', 'Steel Team', 'Welding Equipment'],
    milestones: true,
    estimatedCost: 150000,
    actualCost: 127500,
    createdDate: '2024-02-01',
    lastUpdated: '2024-02-15',
  },
];

interface ProjectActivityProps {
  selectedSiteId?: string;
  onSiteSelect?: (siteId: string) => void;
}

export function ProjectActivity({ selectedSiteId, onSiteSelect }: ProjectActivityProps) {
  const [sites] = useState<Site[]>(mockSites);
  const [activities, setActivities] = useState<ProjectActivity[]>(mockActivities);
  const [selectedSite, setSelectedSite] = useState<string>(selectedSiteId || '');
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ProjectActivity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter] = useState<string>('all');

  // Activity form state
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
    estimatedCost: '',
  });

  // Update selectedSite when prop changes
  useEffect(() => {
    if (selectedSiteId) {
      setSelectedSite(selectedSiteId);
      setActivityForm((prev) => ({ ...prev, siteId: selectedSiteId }));
    }
  }, [selectedSiteId]);

  // Filter activities based on selected site and filters
  const filteredActivities = activities.filter((activity) => {
    const matchesSite = selectedSite === '' || activity.siteId === selectedSite;
    const matchesSearch =
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.assignedTeam.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || activity.priority === priorityFilter;

    return matchesSite && matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const handleSiteSelect = (siteId: string) => {
    setSelectedSite(siteId);
    setActivityForm((prev) => ({ ...prev, siteId }));
    if (onSiteSelect) {
      onSiteSelect(siteId);
    }
  };

  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = new Date(activityForm.startDate);
    const endDate = new Date(
      startDate.getTime() + Number(activityForm.duration) * 24 * 60 * 60 * 1000,
    );
    const selectedSiteData = sites.find((site) => site.id === activityForm.siteId);

    const newActivity: ProjectActivity = {
      id: (activities.length + 1).toString(),
      siteId: activityForm.siteId,
      siteName: selectedSiteData?.name || '',
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
      resources: activityForm.resources
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r),
      milestones: activityForm.milestones,
      estimatedCost: Number(activityForm.estimatedCost),
      actualCost: 0,
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    if (editingActivity) {
      // Update existing activity
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === editingActivity.id
            ? { ...newActivity, id: editingActivity.id, actualCost: editingActivity.actualCost }
            : activity,
        ),
      );
    } else {
      // Add new activity
      setActivities((prev) => [...prev, newActivity]);
    }

    // Reset form and close dialog
    setActivityForm({
      siteId: selectedSite,
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
      estimatedCost: '',
    });
    setEditingActivity(null);
    setIsActivityDialogOpen(false);
  };

  const handleEditActivity = (activity: ProjectActivity) => {
    setEditingActivity(activity);
    setActivityForm({
      siteId: activity.siteId,
      name: activity.name,
      description: activity.description,
      startDate: activity.startDate,
      duration: activity.duration.toString(),
      assignedTeam: activity.assignedTeam,
      priority: activity.priority,
      category: activity.category,
      dependencies: activity.dependencies,
      resources: activity.resources.join(', '),
      milestones: activity.milestones,
      estimatedCost: activity.estimatedCost.toString(),
    });
    setIsActivityDialogOpen(true);
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivities((prev) => prev.filter((activity) => activity.id !== activityId));
  };

  const updateActivityProgress = (activityId: string, progress: number) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              progress,
              status: progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started',
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : activity,
      ),
    );
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
        return 'bg-green-100 text-green-800';
    }
  };

  const getCategoryIcon = (category: ProjectActivity['category']) => {
    switch (category) {
      case 'Foundation':
        return Building2;
      case 'Structure':
        return Target;
      case 'MEP':
        return Zap;
      case 'Finishing':
        return Users;
      case 'External':
        return MapPin;
      default:
        return Activity;
    }
  };

  // Calculate summary statistics
  const totalActivities = filteredActivities.length;
  const completedActivities = filteredActivities.filter((a) => a.status === 'completed').length;
  const inProgressActivities = filteredActivities.filter((a) => a.status === 'in-progress').length;
  const delayedActivities = filteredActivities.filter((a) => a.status === 'delayed').length;
  const totalEstimatedCost = filteredActivities.reduce((sum, a) => sum + a.estimatedCost, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Record daily site activity and quantities."
        actions={
          <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingActivity(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingActivity ? 'Edit Activity' : 'Add New Activity'}</DialogTitle>
                <DialogDescription>
                  {editingActivity ? 'Update activity details' : 'Create a new project activity'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleActivitySubmit} className="space-y-4">
                {/* Site Selection */}
                <div className="space-y-2">
                  <Label htmlFor="siteId">Site *</Label>
                  <Select
                    value={activityForm.siteId}
                    onValueChange={(value) => {
                      setActivityForm((prev) => ({ ...prev, siteId: value }));
                      handleSiteSelect(value);
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Activity Name *</Label>
                    <Input
                      id="name"
                      value={activityForm.name}
                      onChange={(e) =>
                        setActivityForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter activity name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={activityForm.category}
                      onValueChange={(value: ProjectActivity['category']) => {
                        setActivityForm((prev) => ({ ...prev, category: value }));
                      }}
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
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Quality Control">Quality Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={activityForm.description}
                    onChange={(e) =>
                      setActivityForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe the activity details"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
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
                    <Label htmlFor="duration">Duration (Days) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={activityForm.duration}
                      onChange={(e) =>
                        setActivityForm((prev) => ({ ...prev, duration: e.target.value }))
                      }
                      placeholder="10"
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      value={activityForm.estimatedCost}
                      onChange={(e) =>
                        setActivityForm((prev) => ({ ...prev, estimatedCost: e.target.value }))
                      }
                      placeholder="100000"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignedTeam">Assigned Team *</Label>
                    <Input
                      id="assignedTeam"
                      value={activityForm.assignedTeam}
                      onChange={(e) =>
                        setActivityForm((prev) => ({ ...prev, assignedTeam: e.target.value }))
                      }
                      placeholder="Team name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={activityForm.priority}
                      onValueChange={(value: ProjectActivity['priority']) => {
                        setActivityForm((prev) => ({ ...prev, priority: value }));
                      }}
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

                <div className="space-y-2">
                  <Label htmlFor="resources">Resources</Label>
                  <Input
                    id="resources"
                    value={activityForm.resources}
                    onChange={(e) =>
                      setActivityForm((prev) => ({ ...prev, resources: e.target.value }))
                    }
                    placeholder="Equipment, tools (comma separated)"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="milestones"
                    checked={activityForm.milestones}
                    onChange={(e) =>
                      setActivityForm((prev) => ({ ...prev, milestones: e.target.checked }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="milestones">This is a milestone activity</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsActivityDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingActivity ? 'Update Activity' : 'Create Activity'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-semibold">{totalActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-semibold">{completedActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold">{inProgressActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Delayed</p>
                <p className="text-2xl font-semibold">{delayedActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-semibold">
                  ₹{(totalEstimatedCost / 100000).toFixed(1)}L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSite} onValueChange={handleSiteSelect}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Foundation">Foundation</SelectItem>
            <SelectItem value="Structure">Structure</SelectItem>
            <SelectItem value="MEP">MEP</SelectItem>
            <SelectItem value="Finishing">Finishing</SelectItem>
            <SelectItem value="External">External</SelectItem>
            <SelectItem value="Planning">Planning</SelectItem>
            <SelectItem value="Quality Control">Quality Control</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => {
                  const CategoryIcon = getCategoryIcon(activity.category);
                  return (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <CategoryIcon className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">{activity.name}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {activity.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activity.siteName}</div>
                          <div className="text-sm text-gray-500">
                            {sites.find((s) => s.id === activity.siteId)?.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{activity.category}</Badge>
                      </TableCell>
                      <TableCell>{activity.assignedTeam}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{activity.duration} days</div>
                          <div className="text-gray-500">
                            {activity.startDate} - {activity.endDate}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{activity.progress}%</span>
                            {activity.milestones && <Target className="h-3 w-3 text-yellow-600" />}
                          </div>
                          <Progress value={activity.progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(activity.priority)}>
                          {activity.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>₹{activity.estimatedCost.toLocaleString()}</div>
                          {activity.actualCost > 0 && (
                            <div className="text-gray-500">
                              Spent: ₹{activity.actualCost.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateActivityProgress(
                                activity.id,
                                Math.min(100, activity.progress + 10),
                              )
                            }
                            disabled={activity.status === 'completed'}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditActivity(activity)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
