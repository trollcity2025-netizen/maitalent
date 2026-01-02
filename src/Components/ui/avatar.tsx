import React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function Avatar({ className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

export interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {}

export function AvatarImage(props: AvatarImageProps) {
  return <img {...props} />;
}

export interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-slate-700 text-slate-100 text-sm",
        className
      )}
      {...props}
    />
  );
}

