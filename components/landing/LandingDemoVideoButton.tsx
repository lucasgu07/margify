import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { DEMO_DASHBOARD_ENTRY } from "@/lib/demo-entry";

/** CTA demo: entra al dashboard con datos de ejemplo, sin login. */
export function LandingDemoVideoButton({ className }: { className?: string }) {
  return (
    <Link
      href={DEMO_DASHBOARD_ENTRY}
      className={buttonClassName("secondary", className)}
    >
      Explorar demo
    </Link>
  );
}
