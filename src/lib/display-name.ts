import type { User } from "@supabase/supabase-js";

export const USERNAME_MAX = 30;

/** The name shown for a signed-in student: the one they chose, else their email's local part. */
export function displayName(user: User | null | undefined): string {
  const chosen = typeof user?.user_metadata?.username === "string" ? user.user_metadata.username.trim() : "";
  if (chosen) return chosen;
  const local = user?.email?.split("@")[0] ?? "";
  return local || "Student";
}

/** Trims and caps a typed username; null when nothing usable is left. */
export function cleanUsername(raw: string): string | null {
  const v = raw.replace(/\s+/g, " ").trim().slice(0, USERNAME_MAX);
  return v.length >= 2 ? v : null;
}
