'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const DialogTitleContext = React.createContext<string | undefined>(undefined);

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  /** Use when the dialog has no visible title (DialogHeader with heading). */
  'aria-label'?: string;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  className,
  'aria-label': ariaLabel,
}: DialogProps) {
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const labelledBy = ariaLabel ? undefined : titleId;

  return (
    <DialogTitleContext.Provider value={titleId}>
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 motion-reduce:transition-none"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'fixed left-[50%] top-[50%] z-[60] w-[calc(100%-max(2rem,env(safe-area-inset-left,0px)+env(safe-area-inset-right,0px)))] max-h-[min(90dvh,40rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-y-auto overscroll-y-contain rounded-lg border bg-background shadow-lg outline-none transition-transform duration-200 ease-out motion-reduce:transition-none',
          '[padding-block:max(1.25rem,env(safe-area-inset-top,0px))_max(1.25rem,env(safe-area-inset-bottom,0px))]',
          '[padding-inline:max(1rem,env(safe-area-inset-left,0px))_max(1rem,env(safe-area-inset-right,0px))]',
          'sm:[padding-block:max(1.5rem,env(safe-area-inset-top,0px))_max(1.5rem,env(safe-area-inset-bottom,0px))]',
          'sm:[padding-inline:max(1.5rem,env(safe-area-inset-left,0px))_max(1.5rem,env(safe-area-inset-right,0px))]',
          className,
        )}
      >
        {children}
      </div>
    </DialogTitleContext.Provider>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
  const titleId = React.useContext(DialogTitleContext);

  return (
    <div className="flex items-start justify-between gap-3 pb-4">
      <h2 id={titleId} className="text-lg font-semibold leading-snug text-foreground pr-2">
        {children}
      </h2>
      {onClose && (
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar" className="shrink-0">
          <X className="h-4 w-4" aria-hidden />
        </Button>
      )}
    </div>
  );
}
