"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-card !text-foreground !border-border !shadow-lg",
          title: "!text-sm !font-semibold",
          description: "!text-sm !text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-secondary !text-foreground",
          success: "[&_[data-sonner-icon]]:!text-success",
          error: "[&_[data-sonner-icon]]:!text-destructive",
        },
      }}
      {...props}
    />
  );
}
