'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Payment } from '@/types';

interface PaymentRecordFormProps {
  payments: Payment[];
  onSubmit: (data: PaymentRecordFormData) => Promise<void> | void;
  onCancel: () => void;
}

const recordSchema = z.object({
  paymentId: z.string().min(1, 'Select a payment to update.'),
  paidDate: z.date(),
  status: z.enum(['pending', 'completed', 'overdue']),
});

export type PaymentRecordFormData = z.infer<typeof recordSchema>;

export default function PaymentRecordForm({ payments, onSubmit, onCancel }: PaymentRecordFormProps) {
  const form = useForm<PaymentRecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      paymentId: '',
      status: 'completed',
    },
  });

  const handleSubmit = async (data: PaymentRecordFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="paymentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {payments.map((payment) => (
                    <SelectItem key={payment.id} value={payment.id}>
                      {payment.clientName} · ₹{payment.amount.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paidDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paid Date *</FormLabel>
              <FormControl>
                <DatePicker date={field.value ?? undefined} onSelect={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Update Payment</Button>
        </div>
      </form>
    </Form>
  );
}
