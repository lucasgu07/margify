import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function AuthShell({
  children,
  quote,
}: {
  children: React.ReactNode;
  quote: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-margify-bg md:flex-row">
      <div className="flex flex-1 flex-col justify-between bg-margify-black px-8 py-10 md:max-w-md md:border-r md:border-margify-border lg:max-w-lg">
        <Link href="/">
          <Logo size="lg" />
        </Link>
        <p className="mt-10 max-w-sm text-lg leading-relaxed text-margify-muted md:mt-0">
          {quote}
        </p>
        <p className="text-xs text-margify-muted">© Margify 2026</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-10 md:px-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
