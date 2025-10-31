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

interface PaymentContractFormData {
  clientName: string;
  projectName: string;
  contractValue: string;
  dueDate: string;
  paymentTerms: string;
  invoiceNumber: string;
  notes: string;
}

interface PaymentContractFormProps {
  onSubmit: (data: PaymentContractFormData) => void;
  onCancel: () => void;
}

export default function PaymentContractForm({ onSubmit, onCancel }: PaymentContractFormProps) {
  const [formData, setFormData] = useState<PaymentContractFormData>({
    clientName: '',
    projectName: '',
    contractValue: '',
    dueDate: '',
    paymentTerms: '',
    invoiceNumber: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, dueDate: date ? date.toISOString().split('T')[0] : '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name *</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={handleChange}
            placeholder="ABC Developers"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name *</Label>
          <Input
            id="projectName"
            value={formData.projectName}
            onChange={handleChange}
            placeholder="Residential Complex A"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contractValue">Contract Value (₹) *</Label>
          <Input
            id="contractValue"
            type="number"
            value={formData.contractValue}
            onChange={handleChange}
            placeholder="50000000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <DatePicker
            date={formData.dueDate ? new Date(formData.dueDate) : undefined}
            onSelect={handleDateChange}
            placeholder="Select due date"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentTerms">Payment Terms *</Label>
          <Select
            value={formData.paymentTerms}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentTerms: value }))}
          >
            <SelectTrigger id="paymentTerms">
              <SelectValue placeholder="Select payment terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Net 30">Net 30</SelectItem>
              <SelectItem value="Net 45">Net 45</SelectItem>
              <SelectItem value="Net 60">Net 60</SelectItem>
              <SelectItem value="On Delivery">On Delivery</SelectItem>
              <SelectItem value="Advance Payment">Advance Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number *</Label>
          <Input
            id="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            placeholder="INV-001234"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes about the payment contract..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Contract</Button>
      </div>
    </form>
  );
}
