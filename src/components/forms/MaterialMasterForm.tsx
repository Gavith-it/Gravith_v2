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
import { getActiveUOMs, type UOMItem } from '@/components/shared/masterData';

type MaterialMasterFormState = {
  name: string;
  category: MaterialMasterInput['category'];
  unit: string;
  quantity: string;
  consumedQuantity: string;
  standardRate: string;
  isActive: boolean;
  hsn: string;
  taxRate: string;
};

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
  const [formData, setFormData] = useState<MaterialMasterFormState>({
    name: defaultValues?.name || '',
    category: defaultValues?.category || 'Cement',
    unit: defaultValues?.unit || '',
    quantity:
      defaultValues?.quantity !== undefined ? String(defaultValues.quantity) : '',
    consumedQuantity:
      defaultValues?.consumedQuantity !== undefined ? String(defaultValues.consumedQuantity) : '0',
    standardRate:
      defaultValues?.standardRate !== undefined ? String(defaultValues.standardRate) : '',
    isActive: defaultValues?.isActive ?? true,
    hsn: defaultValues?.hsn || '',
    taxRate: defaultValues?.taxRate !== undefined ? String(defaultValues.taxRate) : '18',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uomOptions] = useState<UOMItem[]>(getActiveUOMs());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const standardRateValue = parseFloat(formData.standardRate || '0');
      const taxRateValue = parseFloat(formData.taxRate || '0');
      const parsedQuantity = Number(formData.quantity);
      const quantityValue = Number.isFinite(parsedQuantity) ? Math.max(0, parsedQuantity) : 0;
      const parsedConsumed = Number(formData.consumedQuantity);
      const consumedValue = Number.isFinite(parsedConsumed)
        ? Math.min(Math.max(0, parsedConsumed), quantityValue)
        : 0;

      const payload: MaterialMasterInput = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        quantity: quantityValue,
        consumedQuantity: consumedValue,
        standardRate: standardRateValue,
        isActive: formData.isActive,
        hsn: formData.hsn,
        taxRate: taxRateValue,
      };

      await onSubmit(payload);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="unit" className="text-sm font-medium">
            Unit <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.unit || ''}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
            required
          >
            <SelectTrigger id="unit" className="transition-all focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Select unit from UOM master" />
            </SelectTrigger>
            <SelectContent>
              {uomOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No active UOMs found. Add UOMs from Masters page.
                </div>
              ) : (
                uomOptions.map((uom) => (
                  <SelectItem key={uom.id} value={uom.code}>
                    {uom.code} - {uom.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select unit from UOM master for validation.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-sm font-medium">
            Available Quantity
          </Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.quantity}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                quantity: e.target.value,
              }))
            }
            placeholder="0"
            required
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="consumed-quantity" className="text-sm font-medium">
            Consumed Quantity
          </Label>
          <Input
            id="consumed-quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.consumedQuantity}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                consumedQuantity: e.target.value,
              }))
            }
            placeholder="0"
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
                standardRate: e.target.value,
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
                taxRate: e.target.value,
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
