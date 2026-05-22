import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { META_COOKIE, META_GRAPH_BASE, parseMetaSession } from "@/lib/meta-auth";

export const runtime = "nodejs";

type Body = { status?: "ACTIVE" | "PAUSED" };

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const campaignId = params.id?.trim();
  if (!campaignId) {
    return NextResponse.json({ error: "missing_campaign_id" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "ACTIVE" && status !== "PAUSED") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const raw = cookies().get(META_COOKIE)?.value;
  const session = parseMetaSession(raw);
  if (!session?.access_token) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const url = new URL(`${META_GRAPH_BASE}/${campaignId}`);
  url.searchParams.set("access_token", session.access_token);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ status }),
  });

  const data = (await res.json()) as { success?: boolean; error?: { message?: string } };
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? "meta_update_failed" },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true, id: campaignId, status });
}
