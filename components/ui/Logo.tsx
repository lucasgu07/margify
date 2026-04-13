import { cn } from "@/lib/utils";

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <span className={cn("font-bold tracking-tight text-white", text, className)}>
      Margify<span className="text-margify-cyan">.</span>
    </span>
  );
}
