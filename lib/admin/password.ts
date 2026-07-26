import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

const N = 16_384;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(
  password: string,
  options: { salt?: Buffer } = {},
): Promise<string> {
  const salt = options.salt ?? randomBytes(16);
  const derived = await deriveKey(password, salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  candidate: string,
  encodedHash: string,
): Promise<boolean> {
  try {
    const [algorithm, nValue, rValue, pValue, saltValue, hashValue, extra] =
      encodedHash.split("$");
    if (algorithm !== "scrypt" || extra !== undefined) return false;
    const n = Number(nValue);
    const r = Number(rValue);
    const p = Number(pValue);
    if (n !== N || r !== R || p !== P) return false;
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(hashValue, "base64url");
    if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;
    const actual = await deriveKey(candidate, salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: 64 * 1024 * 1024,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
