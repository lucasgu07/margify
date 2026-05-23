import { getAuthUser } from "@/lib/server/auth-user";
import {
  saveUserIntegration,
  type IntegrationProvider,
} from "@/lib/server/user-integrations";

/** Guarda sesión OAuth en Supabase si hay usuario logueado (además de la cookie). */
export async function persistOAuthSession(
  provider: IntegrationProvider,
  payload: Record<string, unknown>
): Promise<void> {
  const user = await getAuthUser();
  if (!user) return;
  await saveUserIntegration(user.id, provider, payload);
}
