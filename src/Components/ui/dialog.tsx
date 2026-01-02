import React from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open?: boolean;
  onOpenChange?(open: boolean): void;
  children: React.ReactNode;
}

export function Dialog({ open = false, children }: DialogProps) {
  if (!open) return null;
  return <>{children}</>;
}

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogContent({ className, ...props }: DialogContentProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/80",
        className
      )}
      {...props}
    />
  );
}

export interface DialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export interface DialogTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-slate-400", className)}
      {...props}
    />
  );
}

export interface DialogTriggerProps
  extends React.HTMLAttributes<HTMLButtonElement> {}

export function DialogTrigger({ className, ...props }: DialogTriggerProps) {
  return (
    <button
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    />
  );
}

export interface DialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn("mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

