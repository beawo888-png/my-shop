import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "./session";

export const ADMIN_SESSION_COOKIE = "admin_session";

export async function getAdminSession() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return token ? verifySession(token, secret) : null;
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?next=%2Fadmin%2Fai-visits");
  }
  return session;
}
