'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface TaxRateFormData {
  code: string;
  name: string;
  rate: number;
  description: string;
  isActive: boolean;
}

interface TaxRateFormProps {
  onSubmit: (data: TaxRateFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<TaxRateFormData>;
  isEdit?: boolean;
}

export default function TaxRateForm({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
}: TaxRateFormProps) {
  const [formData, setFormData] = useState<TaxRateFormData>({
    code: defaultValues?.code || '',
    name: defaultValues?.name || '',
    rate: defaultValues?.rate || 0,
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
          <Label htmlFor="tax-code" className="text-sm font-medium">
            Tax Code
          </Label>
          <Input
            id="tax-code"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="e.g., GST18, IGST12"
            required
            disabled={isEdit}
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax-name" className="text-sm font-medium">
            Tax Name
          </Label>
          <Input
            id="tax-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter tax name"
            required
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tax-rate" className="text-sm font-medium">
          Tax Rate (%)
        </Label>
        <Input
          id="tax-rate"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={formData.rate}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))
          }
          placeholder="Enter tax rate percentage"
          required
          className="transition-all focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-muted-foreground">
          Enter the percentage value (e.g., 18 for 18%)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tax-description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="tax-description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter tax rate description"
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
        <Button type="submit">{isEdit ? 'Update Tax Rate' : 'Add Tax Rate'}</Button>
      </div>
    </form>
  );
}
