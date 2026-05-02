import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-margify-cyan text-black font-bold hover:brightness-110 active:brightness-95",
  secondary:
    "border border-white text-margify-text bg-transparent hover:bg-white/5",
  ghost: "text-margify-muted hover:text-margify-cyan hover:bg-margify-cyan/15",
  danger: "bg-margify-negative text-white font-semibold hover:brightness-110",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm transition-all duration-margify ease-out disabled:pointer-events-none disabled:opacity-40 motion-safe:active:scale-[0.97]";

export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type={type} className={buttonClassName(variant, className)} {...props} />
  );
}
