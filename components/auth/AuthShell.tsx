import Link from "next/link";
import { AuthShellStarfield } from "@/components/auth/AuthShellStarfield";
import { Logo } from "@/components/ui/Logo";

export function AuthShell({
  children,
  quote,
}: {
  children: React.ReactNode;
  quote: string;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden md:flex-row">
      <div
        className="pointer-events-none absolute inset-0 bg-margify-bg"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-margify-cyan/[0.14] via-margify-bg via-45% to-margify-teal/[0.55]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-tl from-transparent via-margify-teal/10 to-margify-cyan/[0.06]"
        aria-hidden
      />
      <AuthShellStarfield />

      <div className="relative z-10 flex flex-1 flex-col justify-between px-8 py-10 md:max-w-md md:border-r md:border-white/[0.06] lg:max-w-lg">
        <Link href="/">
          <Logo size="lg" priority />
        </Link>
        <p className="mt-10 max-w-sm text-lg leading-relaxed text-margify-muted md:mt-0">
          {quote}
        </p>
        <p className="text-xs text-margify-muted/90">© Margify 2026</p>
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 md:px-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
