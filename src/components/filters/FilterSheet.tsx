import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type FilterSection = {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  className?: string;
};

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  sections: FilterSection[];
  onApply: () => void;
  onReset: () => void;
  isDirty?: boolean;
  applyLabel?: string;
  resetLabel?: string;
  className?: string;
}

export function FilterSheet({
  open,
  onOpenChange,
  title = 'Filters',
  description,
  sections,
  onApply,
  onReset,
  isDirty = false,
  applyLabel = 'Apply filters',
  resetLabel = 'Reset filters',
  className,
}: FilterSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex h-auto max-h-[80vh] w-[min(92vw,520px)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/95 p-0 shadow-2xl backdrop-blur',
          className,
        )}
      >
        <DialogHeader className="border-b border-border/60 bg-muted/40 px-6 pb-4 pt-6 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={onReset}
              disabled={!isDirty}
              className="rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background"
            >
              {resetLabel}
            </Button>
            <Button onClick={onApply} className="rounded-full px-5 py-2 text-sm font-semibold shadow-sm">
              {applyLabel}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea
          className="flex-1 overflow-y-auto pr-2"
          style={{ height: 'calc(80vh - 180px)', maxHeight: 'calc(80vh - 180px)' }}
        >
          <div className="space-y-4 px-6 py-6">
            {sections.map((section) => (
              <section key={section.id} className={cn(section.className)}>
                <div className="rounded-xl border border-border/60 bg-background/70 p-5 shadow-sm ring-1 ring-border/50">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </h3>
                    {section.description ? (
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">
                        {section.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-3">{section.content}</div>
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-border/60 bg-muted/50 px-6 py-4 text-sm text-muted-foreground">
          Tip: adjust filters and tap “Apply filters” above to update the list instantly.
        </div>
      </DialogContent>
    </Dialog>
  );
}
