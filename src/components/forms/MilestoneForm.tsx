'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MilestoneFormData {
  name: string;
  date: string;
  description: string;
}

interface MilestoneFormProps {
  onSubmit: (data: MilestoneFormData) => void;
  onCancel: () => void;
}

export default function MilestoneForm({ onSubmit, onCancel }: MilestoneFormProps) {
  const [formData, setFormData] = useState<MilestoneFormData>({
    name: '',
    date: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, date: date ? date.toISOString().split('T')[0] : '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Milestone Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Foundation Complete"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Target Date *</Label>
        <DatePicker
          date={formData.date ? new Date(formData.date) : undefined}
          onSelect={handleDateChange}
          placeholder="Select milestone date"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description of the milestone..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Milestone</Button>
      </div>
    </form>
  );
}
