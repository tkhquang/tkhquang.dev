"use client";

import {
  Dialog as AriaDialog,
  DialogDismiss,
  DialogHeading,
  DialogDescription,
  useDialogStore,
} from "@ariakit/react";
import { X } from "lucide-react";
import { cn } from "@/utils/css";

interface DialogProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Dialog component using Ariakit with shadcn design system
 * Follows Ariakit's official pattern with backdrop prop for proper centering
 */
export function Dialog({
  children,
  title,
  description,
  open,
  onOpenChange,
  className,
}: DialogProps) {
  const dialog = useDialogStore({
    open,
    setOpen: onOpenChange,
  });

  return (
    <AriaDialog
      store={dialog}
      backdrop={
        <div className="data-enter:animate-in data-enter:fade-in fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
      }
      className={cn(
        // Positioning - Ariakit handles centering automatically
        "fixed inset-3 left-1/2! z-50 m-auto translate-x-[-50%]",
        // Sizing
        "h-fit w-full max-w-lg",
        "max-h-[calc(100dvh-1.5rem)]",
        // Styling
        "flex flex-col gap-4 overflow-auto rounded-xl",
        "bg-background border-border border p-6 shadow-2xl",
        // Animations - Ariakit provides data-enter attribute
        "scale-95 opacity-0",
        "data-enter:scale-100 data-enter:opacity-100",
        "transition-all duration-200 ease-out",
        // Desktop adjustments
        "sm:inset-auto sm:top-[10vh] sm:bottom-[10vh]",
        "sm:max-h-[80vh] sm:rounded-2xl sm:p-8",
        className
      )}
    >
      <div className="flex flex-col space-y-2 text-center sm:text-left">
        {title && (
          <DialogHeading className="text-xl leading-none font-semibold tracking-tight">
            {title}
          </DialogHeading>
        )}
        {description && (
          <DialogDescription className="text-muted-foreground text-sm">
            {description}
          </DialogDescription>
        )}

        <DialogDismiss
          className={cn(
            "absolute top-4 right-4 rounded-sm opacity-70",
            "transition-opacity hover:opacity-100",
            "focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none",
            "disabled:pointer-events-none"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogDismiss>
      </div>

      <div className="flex-1">{children}</div>
    </AriaDialog>
  );
}
