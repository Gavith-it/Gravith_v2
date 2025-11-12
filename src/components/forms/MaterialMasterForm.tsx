'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { MaterialMasterInput } from '@/types/materials';

interface MaterialMasterFormProps {
  onSubmit: (data: MaterialMasterInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<MaterialMasterInput>;
  isEdit?: boolean;
}

export default function MaterialMasterForm({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
}: MaterialMasterFormProps) {
  const [formData, setFormData] = useState<MaterialMasterInput>({
    name: defaultValues?.name || '',
    category: defaultValues?.category || 'Cement',
    unit: defaultValues?.unit || '',
    standardRate: defaultValues?.standardRate || 0,
    isActive: defaultValues?.isActive ?? true,
    hsn: defaultValues?.hsn || '',
    taxRate: defaultValues?.taxRate || 18,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="material-name" className="text-sm font-medium">
            Material Name
          </Label>
          <Input
            id="material-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter material name"
            required
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {/* Category Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            Category
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                category: value as MaterialMasterInput['category'],
              }))
            }
          >
            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cement">Cement</SelectItem>
              <SelectItem value="Steel">Steel</SelectItem>
              <SelectItem value="Concrete">Concrete</SelectItem>
              <SelectItem value="Bricks">Bricks</SelectItem>
              <SelectItem value="Sand">Sand</SelectItem>
              <SelectItem value="Aggregate">Aggregate</SelectItem>
              <SelectItem value="Timber">Timber</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
              <SelectItem value="Paint">Paint</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="unit" className="text-sm font-medium">
            Unit
          </Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
            placeholder="e.g., bags, kg, cubic meters"
            required
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="standard-rate" className="text-sm font-medium">
            Standard Rate (₹)
          </Label>
          <Input
            id="standard-rate"
            type="number"
            value={formData.standardRate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                standardRate: parseFloat(e.target.value) || 0,
              }))
            }
            placeholder="0"
            required
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="hsn-code" className="text-sm font-medium">
            HSN Code
          </Label>
          <Input
            id="hsn-code"
            value={formData.hsn}
            onChange={(e) => setFormData((prev) => ({ ...prev, hsn: e.target.value }))}
            placeholder="Enter HSN code"
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax-rate" className="text-sm font-medium">
            Tax Rate (%)
          </Label>
          <Input
            id="tax-rate"
            type="number"
            value={formData.taxRate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                taxRate: parseFloat(e.target.value) || 18,
              }))
            }
            placeholder="18"
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
        />
        <Label className="text-sm font-medium">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEdit ? 'Updating…' : 'Adding…') : isEdit ? 'Update Material' : 'Add Material'}
        </Button>
      </div>
    </form>
  );
}
