'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDateOnly, parseDateOnly } from '@/lib/utils/date';

interface ActivityFormData {
  siteId: string;
  name: string;
  description: string;
  startDate: string;
  duration: string;
  assignedTeam: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category: 'Foundation' | 'Structure' | 'Finishing' | 'Utilities' | 'Other';
  dependencies: string;
  resources: string;
  milestones: boolean;
}

interface ActivityFormProps {
  sites: Array<{ id: string; name: string }>;
  onSubmit: (data: ActivityFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ActivityForm({
  sites,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ActivityFormProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    siteId: '',
    name: '',
    description: '',
    startDate: '',
    duration: '',
    assignedTeam: '',
    priority: 'Medium',
    category: 'Foundation',
    dependencies: '',
    resources: '',
    milestones: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSelectChange = (id: keyof ActivityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, startDate: date ? formatDateOnly(date) : '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="siteId">Site *</Label>
          <Select
            value={formData.siteId}
            onValueChange={(value) => handleSelectChange('siteId', value)}
          >
            <SelectTrigger id="siteId">
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Activity Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Foundation Work"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed description of the activity..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <DatePicker
            date={parseDateOnly(formData.startDate) ?? undefined}
            onSelect={handleDateChange}
            placeholder="Select start date"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (Days) *</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            placeholder="30"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignedTeam">Assigned Team *</Label>
          <Input
            id="assignedTeam"
            value={formData.assignedTeam}
            onChange={handleChange}
            placeholder="Team A"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              handleSelectChange('priority', value as ActivityFormData['priority'])
            }
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            handleSelectChange('category', value as ActivityFormData['category'])
          }
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Foundation">Foundation</SelectItem>
            <SelectItem value="Structure">Structure</SelectItem>
            <SelectItem value="Finishing">Finishing</SelectItem>
            <SelectItem value="Utilities">Utilities</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dependencies">Dependencies</Label>
        <Input
          id="dependencies"
          value={formData.dependencies}
          onChange={handleChange}
          placeholder="Activity IDs separated by commas"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resources">Resources</Label>
        <Input
          id="resources"
          value={formData.resources}
          onChange={handleChange}
          placeholder="Equipment, materials, etc."
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="milestones"
          type="checkbox"
          checked={formData.milestones}
          onChange={handleChange}
          className="rounded"
        />
        <Label htmlFor="milestones">Has Milestones</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="mr-2">Loading...</span>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </>
          ) : (
            'Add Activity'
          )}
        </Button>
      </div>
    </form>
  );
}
