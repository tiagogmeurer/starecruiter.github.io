// services/authService.ts
// Gate simples (front-only) para GitHub Pages.

const STORAGE_KEY = "starecruiter_auth_v1";
const SESSION_DAYS = 7;

const PASSWORD_SHA256_HEX = "8966f5aa2586ddd626b15e7ba3773ad6cd6669882cf274950a0012483d93a181";

type AuthRecord = {
  ok: boolean;
  exp: number; // epoch ms
};

function now() {
  return Date.now();
}

function daysToMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

function toHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return toHex(hash);
}

export function isAuthed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed: AuthRecord = JSON.parse(raw);
    if (!parsed?.ok || !parsed?.exp) return false;
    if (now() > parsed.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function loginWithPassword(password: string) {
  const hash = await sha256Hex(password.trim());
  const ok = hash === PASSWORD_SHA256_HEX;

  if (!ok) return { ok: false as const };

  const rec: AuthRecord = {
    ok: true,
    exp: now() + daysToMs(SESSION_DAYS),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  return { ok: true as const };
}