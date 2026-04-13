import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-control border border-margify-border bg-margify-card px-3 py-2.5 text-sm text-margify-text outline-none transition-[border,box-shadow] duration-margify placeholder:text-margify-muted focus:border-margify-cyan focus:ring-1 focus:ring-margify-cyan",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-margify-text", className)}
      {...props}
    >
      {children}
    </label>
  );
}
