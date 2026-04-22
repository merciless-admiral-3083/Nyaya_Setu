import { cookies } from "next/headers";
import { findUserById, normalizeUser } from "./user-db";
import { getSessionCookieName, verifySessionToken } from "./auth";

export async function getCurrentUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload?.sub) {
    return null;
  }

  const user = await findUserById(String(payload.sub));
  return user ? normalizeUser(user) : null;
}
