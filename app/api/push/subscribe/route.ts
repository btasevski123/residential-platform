import { NextResponse } from "next/server";
import { getAccessContext } from "@/lib/auth/current-user";
import { savePushSubscription, deletePushSubscription } from "@/lib/notifications/preferences";

function readSubscription(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };

  if (typeof record.endpoint !== "string" || !record.keys) {
    return null;
  }

  if (typeof record.keys.p256dh !== "string" || typeof record.keys.auth !== "string") {
    return null;
  }

  return {
    endpoint: record.endpoint,
    p256dh: record.keys.p256dh,
    auth: record.keys.auth,
  };
}

export async function POST(request: Request) {
  const ctx = await getAccessContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = readSubscription(await request.json().catch(() => null));
  if (!parsed) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  try {
    await savePushSubscription(ctx, {
      ...parsed,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save subscription" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const ctx = await getAccessContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = readSubscription(await request.json().catch(() => null));
  if (!parsed) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await deletePushSubscription(ctx, parsed.endpoint);
  return NextResponse.json({ ok: true });
}
