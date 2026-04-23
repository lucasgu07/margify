import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-margify-text ring-offset-margify-bg",
        "placeholder:text-margify-muted/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-margify-cyan/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
