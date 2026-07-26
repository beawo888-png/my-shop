import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionPayload = {
  role: "admin";
  iat: number;
  exp: number;
};

const SESSION_TTL_SECONDS = 12 * 60 * 60;

function validSecret(secret: string): boolean {
  return Buffer.byteLength(secret) >= 32;
}

function sign(payloadPart: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadPart).digest("base64url");
}

export function createSession(secret: string, now = new Date()): string {
  if (!validSecret(secret)) throw new Error("Admin session secret is not configured");
  const issuedAt = Math.floor(now.getTime() / 1000);
  const payload: SessionPayload = {
    role: "admin",
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_SECONDS,
  };
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadPart}.${sign(payloadPart, secret)}`;
}

export function verifySession(
  token: string,
  secret: string,
  now = new Date(),
): SessionPayload | null {
  if (!validSecret(secret)) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadPart, signaturePart] = parts;
    const expected = Buffer.from(sign(payloadPart, secret), "base64url");
    const actual = Buffer.from(signaturePart, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (
      payload.role !== "admin" ||
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp) ||
      (payload.iat as number) > nowSeconds + 60 ||
      (payload.exp as number) <= nowSeconds
    ) {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
