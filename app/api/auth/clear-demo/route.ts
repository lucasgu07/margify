import { NextResponse } from "next/server";

const DEMO_COOKIE = "margify_demo";

/**
 * Quita la cookie de modo demo tras login/registro para que el usuario real
 * no quede marcado como "Ver demo".
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return res;
}
