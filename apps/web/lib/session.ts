export type SessionUser = {
  id: string;
  phone: string;
  display_name: string;
  province: string;
  regency: string;
  balance: number;
};

const KEY_PENDING_PHONE = "carbonlink.pending_phone";
const KEY_SESSION = "carbonlink.session";

function ls(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function setPendingPhone(phone: string) {
  ls()?.setItem(KEY_PENDING_PHONE, phone);
}

export function getPendingPhone(): string | null {
  return ls()?.getItem(KEY_PENDING_PHONE) ?? null;
}

export function clearPendingPhone() {
  ls()?.removeItem(KEY_PENDING_PHONE);
}

export function setSession(user: SessionUser) {
  ls()?.setItem(KEY_SESSION, JSON.stringify(user));
}

export function getSession(): SessionUser | null {
  const raw = ls()?.getItem(KEY_SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function updateSessionProfile(
  patch: Partial<Pick<SessionUser, "display_name" | "province" | "regency">>
) {
  const current = getSession();
  if (!current) return;
  setSession({ ...current, ...patch });
}

export function clearSession() {
  ls()?.removeItem(KEY_SESSION);
  ls()?.removeItem(KEY_PENDING_PHONE);
}

export const DEMO_USER: SessionUser = {
  id: "demo",
  phone: "812 3456 7890",
  display_name: "Pak Asep",
  province: "Jawa Barat",
  regency: "Cianjur",
  balance: 245000,
};

/**
 * Returns active session, falling back to DEMO_USER so the UI
 * never breaks even without a real login flow.
 */
export function getSessionOrDemo(): SessionUser {
  return getSession() ?? DEMO_USER;
}