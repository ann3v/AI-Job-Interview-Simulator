import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User | null | undefined) {
  const fullName = user?.user_metadata?.full_name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  if (typeof user?.email === "string" && user.email.trim()) {
    return user.email.trim();
  }

  return "Candidate";
}

export function getUserInitials(
  displayName: string,
  fallbackEmail?: string | null
) {
  const parts = displayName.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }

  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (parts.length === 1 && parts[0].length === 1) {
    return parts[0].toUpperCase();
  }

  if (fallbackEmail) {
    return fallbackEmail.slice(0, 2).toUpperCase();
  }

  return "AI";
}

export function getUserAvatarStorageKey(userId: string) {
  return `ai-job-interview-simulator.avatar.${userId}`;
}
