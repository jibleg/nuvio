import { readSessionCookie } from "@/lib/auth/session-cookie";
import { getSessionContext } from "./get-session-context";
import type { SessionContext } from "../types";

/**
 * Contexto de sesión del request actual (lee la cookie httpOnly).
 * Lo usan los layouts y guards del área autenticada.
 */
export async function getCurrentSessionContext(): Promise<SessionContext | null> {
  const token = await readSessionCookie();
  if (!token) return null;
  return getSessionContext(token);
}
