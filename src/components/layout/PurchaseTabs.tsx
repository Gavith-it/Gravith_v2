'use client';

import { FileText, Receipt } from 'lucide-react';
import * as React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PurchaseTabsProps {
  activeTab: 'bills' | 'receipts';
  onTabChange: (value: 'bills' | 'receipts') => void;
}

export function PurchaseTabs({ activeTab, onTabChange }: PurchaseTabsProps) {
  const tabs = [
    {
      label: 'Purchase Bills',
      value: 'bills' as const,
      icon: FileText,
    },
    {
      label: 'Material Receipts',
      value: 'receipts' as const,
      icon: Receipt,
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'bills' | 'receipts')} className="mb-0">
      <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
        <CardContent className="px-6 py-4">
          <TabsList className="grid w-full grid-cols-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center justify-center w-full h-full gap-2 font-medium text-sm outline-none"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </CardContent>
      </Card>
    </Tabs>
  );
}
