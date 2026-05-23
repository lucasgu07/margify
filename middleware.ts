import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, isDemoCookieActive } from "@/lib/demo-cookie";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return handleDemoEntry(request, url, pathname, null);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/dashboard") && url.searchParams.get("demo") === "1") {
    url.searchParams.delete("demo");
    const demoRedirect = NextResponse.redirect(url);
    if (!user) {
      demoRedirect.cookies.set(DEMO_COOKIE, "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    } else {
      demoRedirect.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    }
    return demoRedirect;
  }

  if (user) {
    if (isDemoCookieActive(request.cookies.get(DEMO_COOKIE)?.value)) {
      response.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    }
    return response;
  }

  const demoMode =
    pathname.startsWith("/dashboard") &&
    isDemoCookieActive(request.cookies.get(DEMO_COOKIE)?.value);

  if (demoMode) {
    return response;
  }

  const loginUrl = url.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

/** Sin Supabase configurado: solo permitir demo explícita en dashboard. */
function handleDemoEntry(
  request: NextRequest,
  url: NextRequest["nextUrl"],
  pathname: string,
  user: null
) {
  if (pathname.startsWith("/dashboard") && url.searchParams.get("demo") === "1") {
    url.searchParams.delete("demo");
    const res = NextResponse.redirect(url);
    if (!user) {
      res.cookies.set(DEMO_COOKIE, "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }
    return res;
  }

  const demoMode =
    pathname.startsWith("/dashboard") &&
    isDemoCookieActive(request.cookies.get(DEMO_COOKIE)?.value);

  if (demoMode) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    const loginUrl = url.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/onboarding", "/onboarding/:path*"],
};
