'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface MaterialCategoryFormData {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface MaterialCategoryFormProps {
  onSubmit: (data: MaterialCategoryFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<MaterialCategoryFormData>;
  isEdit?: boolean;
}

export default function MaterialCategoryForm({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
}: MaterialCategoryFormProps) {
  const [formData, setFormData] = useState<MaterialCategoryFormData>({
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
          <Label htmlFor="category-code" className="text-sm font-medium">
            Category Code
          </Label>
          <Input
            id="category-code"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="e.g., CEMENT, STEEL"
            required
            disabled={isEdit}
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-name" className="text-sm font-medium">
            Category Name
          </Label>
          <Input
            id="category-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter category name"
            required
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="category-description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter category description"
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
        <Button type="submit">{isEdit ? 'Update Category' : 'Add Category'}</Button>
      </div>
    </form>
  );
}
