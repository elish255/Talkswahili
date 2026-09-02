export type LocalUser = {
  name: string;
  username: string;
  phone: string;
  email: string;
  country: string;
  password: string;
  registeredAt: string;
  paid: boolean;
  balance: number;
  withdrawn: number;
  messageCount: number;
};

const KEY = "talkswahili_user";

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null") as LocalUser | null; } catch { return null; }
}

export function saveLocalUser(user: LocalUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("talkswahili-user-updated"));
}

export function updateLocalUser(patch: Partial<LocalUser>) {
  const user = getLocalUser();
  if (!user) return null;
  const next = { ...user, ...patch };
  saveLocalUser(next);
  return next;
}

export function clearLocalUser() { localStorage.removeItem(KEY); }

export function formatTzs(value: number) {
  return `TZS ${Math.max(0, Math.round(value)).toLocaleString("en-US")}`;
}
