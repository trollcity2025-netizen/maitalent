import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?(value: string): void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const isControlled = value !== undefined && value !== null;
  const current = isControlled ? (value as string) : internal;

  const handleSetValue = (next: string) => {
    if (!isControlled) {
      setInternal(next);
    }
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: current, setValue: handleSetValue }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsContextValue {
  value: string;
  setValue(value: string): void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      className={cn("inline-flex items-center rounded-full bg-slate-800 p-1", className)}
      {...props}
    />
  );
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  className,
  value,
  ...props
}: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={cn(
        "px-3 py-1 text-sm rounded-full transition-colors",
        active
          ? "bg-slate-950 text-white"
          : "text-slate-400 hover:text-white hover:bg-slate-900/60",
        className
      )}
      {...props}
    />
  );
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  className,
  value,
  ...props
}: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={cn(className)} {...props} />;
}
