import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SectionCardProps {
  title?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ title, toolbar, children }: SectionCardProps) {
  return (
    <Card>
      {(title || toolbar) && (
        <CardHeader className="flex flex-row items-center justify-between">
          {title && <CardTitle>{title}</CardTitle>}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </CardHeader>
      )}
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}
