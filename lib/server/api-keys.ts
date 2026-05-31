import { randomBytes, createHash } from "crypto";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";

export function generateApiKey(): string {
  return `mfy_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function findUserIdByApiKey(key: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const hash = hashApiKey(key);
  let page = 1;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data.users.length) break;
    for (const u of data.users) {
      const meta = u.user_metadata as { api_key_hash?: string } | undefined;
      if (meta?.api_key_hash === hash) return u.id;
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

export async function setUserApiKey(userId: string, plainKey: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const { data } = await admin.auth.admin.getUserById(userId);
  if (!data.user) return false;
  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...meta,
      api_key_hash: hashApiKey(plainKey),
      api_key_created_at: new Date().toISOString(),
    },
  });
  return !error;
}
