'use client';

import React, { useState } from 'react';

import { getActiveCategories } from '../shared/masterData';

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
import { Textarea } from '@/components/ui/textarea';

interface MaterialSubCategoryFormData {
  code: string;
  name: string;
  categoryId: string;
  description: string;
  isActive: boolean;
}

interface MaterialSubCategoryFormProps {
  onSubmit: (data: MaterialSubCategoryFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<MaterialSubCategoryFormData>;
  isEdit?: boolean;
}

export default function MaterialSubCategoryForm({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
}: MaterialSubCategoryFormProps) {
  const [formData, setFormData] = useState<MaterialSubCategoryFormData>({
    code: defaultValues?.code || '',
    name: defaultValues?.name || '',
    categoryId: defaultValues?.categoryId || '',
    description: defaultValues?.description || '',
    isActive: defaultValues?.isActive ?? true,
  });

  const categories = getActiveCategories();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="subcategory-code" className="text-sm font-medium">
            Sub-Category Code
          </Label>
          <Input
            id="subcategory-code"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="e.g., OPC, TMT"
            required
            disabled={isEdit}
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subcategory-name" className="text-sm font-medium">
            Sub-Category Name
          </Label>
          <Input
            id="subcategory-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter sub-category name"
            required
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parent-category" className="text-sm font-medium">
          Parent Category
        </Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
        >
          <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
            <SelectValue placeholder="Select parent category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategory-description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="subcategory-description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter sub-category description"
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
        <Button type="submit">{isEdit ? 'Update Sub-Category' : 'Add Sub-Category'}</Button>
      </div>
    </form>
  );
}
