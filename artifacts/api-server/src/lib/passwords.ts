import crypto from "crypto";

// scrypt password hashing (node:crypto, no external deps). Interim local auth
// until the Clerk migration; Clerk then owns password storage entirely.
// Stored format: <salt-hex>:<key-hex> with fixed cost parameters below.

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 32;
const SALT_BYTES = 16;

export const MIN_PASSWORD_LENGTH = 8;

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES);
  const key = await scryptAsync(password, salt);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false;
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = await scryptAsync(password, Buffer.from(saltHex, "hex"));
  const expected = Buffer.from(keyHex, "hex");
  return (
    key.length === expected.length && crypto.timingSafeEqual(key, expected)
  );
}

/** Random readable temp password for admin-created accounts. */
export function generatePassword(): string {
  return crypto.randomBytes(9).toString("base64url");
}
