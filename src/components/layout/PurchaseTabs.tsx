'use client';

import { FileText, Receipt } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function PurchaseTabs() {
  const pathname = usePathname();
  const tabs = [
    {
      label: 'Purchase Bills',
      href: '/purchase',
      icon: FileText,
      value: 'bills',
      active: pathname === '/purchase',
    },
    {
      label: 'Material Receipts',
      href: '/purchase/receipt',
      icon: Receipt,
      value: 'receipts',
      active: pathname === '/purchase/receipt',
    },
  ];
  const activeValue = tabs.find((tab) => tab.active)?.value ?? tabs[0].value;
  return (
    <Tabs value={activeValue} className="mb-0">
      <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
        <CardContent className="px-6 py-4">
          <TabsList className="grid w-full grid-cols-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link key={tab.href} href={tab.href} passHref legacyBehavior>
                  <TabsTrigger
                    asChild
                    value={tab.value}
                    aria-current={tab.active ? 'page' : undefined}
                    className="flex items-center justify-center w-full h-full gap-2 font-medium text-sm outline-none"
                  >
                    <a className="flex items-center justify-center gap-2 w-full h-full">
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </a>
                  </TabsTrigger>
                </Link>
              );
            })}
          </TabsList>
        </CardContent>
      </Card>
    </Tabs>
  );
}
