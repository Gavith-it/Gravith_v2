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

interface PaymentRecordFormData {
  paymentId: string;
  amount: string;
  date: string;
  method: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'Other';
  transactionId: string;
  receivedBy: string;
  notes: string;
}

interface PaymentRecordFormProps {
  payments: Array<{
    id: string;
    clientName: string;
    projectName: string;
    contractValue: number;
    dueDate: string;
    status: string;
  }>;
  onSubmit: (data: PaymentRecordFormData) => void;
  onCancel: () => void;
}

export default function PaymentRecordForm({
  payments,
  onSubmit,
  onCancel,
}: PaymentRecordFormProps) {
  const [formData, setFormData] = useState<PaymentRecordFormData>({
    paymentId: '',
    amount: '',
    date: '',
    method: 'Bank Transfer',
    transactionId: '',
    receivedBy: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof PaymentRecordFormData, value: string) => {
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
        <Label htmlFor="paymentId">Payment Contract *</Label>
        <Select
          value={formData.paymentId}
          onValueChange={(value) => handleSelectChange('paymentId', value)}
        >
          <SelectTrigger id="paymentId">
            <SelectValue placeholder="Select payment contract" />
          </SelectTrigger>
          <SelectContent>
            {payments.map((payment) => (
              <SelectItem key={payment.id} value={payment.id}>
                {payment.clientName} - {payment.projectName} (₹
                {payment.contractValue.toLocaleString()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount Received (₹) *</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="25000000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date Received *</Label>
          <DatePicker
            date={formData.date ? new Date(formData.date) : undefined}
            onSelect={handleDateChange}
            placeholder="Select payment date"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="method">Payment Method *</Label>
          <Select
            value={formData.method}
            onValueChange={(value) =>
              handleSelectChange('method', value as PaymentRecordFormData['method'])
            }
          >
            <SelectTrigger id="method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transactionId">Transaction ID</Label>
          <Input
            id="transactionId"
            value={formData.transactionId}
            onChange={handleChange}
            placeholder="TXN123456789"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="receivedBy">Received By *</Label>
        <Input
          id="receivedBy"
          value={formData.receivedBy}
          onChange={handleChange}
          placeholder="Finance Manager"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes about the payment..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Record Payment</Button>
      </div>
    </form>
  );
}
