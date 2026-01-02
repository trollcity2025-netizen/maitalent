import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps {
  value?: string;
  onValueChange?(value: string): void;
  children: React.ReactNode;
  required?: boolean;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [internal, setInternal] = useState(value ?? "");

  const handleChange = (next: string) => {
    setInternal(next);
    onValueChange?.(next);
  };

  return (
    <SelectContext.Provider value={{ value: value ?? internal, onChange: handleChange }}>
      {children}
    </SelectContext.Provider>
  );
}

interface SelectContextValue {
  value: string;
  onChange(value: string): void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SelectTrigger({ className, ...props }: SelectTriggerProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100",
        className
      )}
      {...props}
    />
  );
}

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const ctx = React.useContext<SelectContextValue | null>(SelectContext);
  return (
    <span className="truncate text-left">
      {ctx?.value || placeholder}
    </span>
  );
}

export interface SelectContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SelectContent({ className, ...props }: SelectContentProps) {
  return (
    <div
      className={cn(
        "mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-700 bg-slate-900 p-1 text-sm shadow-lg",
        className
      )}
      {...props}
    />
  );
}

export interface SelectItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function SelectItem({
  className,
  value,
  children,
  ...props
}: SelectItemProps) {
  const ctx = React.useContext<SelectContextValue | null>(SelectContext);

  return (
    <button
      type="button"
      onClick={() => ctx?.onChange(value)}
      className={cn(
        "flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-left text-sm text-slate-100 hover:bg-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
