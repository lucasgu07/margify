import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEMO_COOKIE = "margify_demo";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  if (pathname.startsWith("/api/margify-ai")) {
    if (request.cookies.get(DEMO_COOKIE)?.value === "1") {
      return NextResponse.json({ error: "No disponible en modo demo" }, { status: 403 });
    }
  }

  if (pathname.startsWith("/dashboard/margify-ai")) {
    if (request.cookies.get(DEMO_COOKIE)?.value === "1") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/dashboard") && url.searchParams.get("demo") === "1") {
    url.searchParams.delete("demo");
    const res = NextResponse.redirect(url);
    res.cookies.set(DEMO_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/api/margify-ai/:path*"],
};
