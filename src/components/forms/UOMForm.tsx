'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface UOMFormData {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface UOMFormProps {
  onSubmit: (data: UOMFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<UOMFormData>;
  isEdit?: boolean;
}

export default function UOMForm({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
}: UOMFormProps) {
  const [formData, setFormData] = useState<UOMFormData>({
    code: defaultValues?.code || '',
    name: defaultValues?.name || '',
    description: defaultValues?.description || '',
    isActive: defaultValues?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="uom-code" className="text-sm font-medium">
            UOM Code
          </Label>
          <Input
            id="uom-code"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="e.g., KG, MTR, BAG"
            required
            disabled={isEdit}
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uom-name" className="text-sm font-medium">
            UOM Name
          </Label>
          <Input
            id="uom-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter UOM name"
            required
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="uom-description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="uom-description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter UOM description"
          rows={3}
          className="transition-all focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
        />
        <Label className="text-sm font-medium">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEdit ? 'Update UOM' : 'Add UOM'}</Button>
      </div>
    </form>
  );
}
