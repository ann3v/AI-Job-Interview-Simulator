import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;
const MISSING_SUPABASE_ENV_MESSAGE =
  "Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(MISSING_SUPABASE_ENV_MESSAGE);
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }

  return browserClient;
}

export function getFriendlyAuthErrorMessage(error: unknown) {
  const fallbackMessage = "Something went wrong. Please try again.";

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const normalizedMessage = error.message.toLowerCase();

  if (normalizedMessage.includes(MISSING_SUPABASE_ENV_MESSAGE.toLowerCase())) {
    return "Authentication is unavailable right now. Check your Supabase environment variables and try again.";
  }

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("load failed")
  ) {
    return "Unable to reach authentication right now. Please check your connection and try again.";
  }

  if (
    normalizedMessage.includes("refresh token") ||
    normalizedMessage.includes("session not found") ||
    normalizedMessage.includes("jwt") ||
    (normalizedMessage.includes("token") &&
      normalizedMessage.includes("expired"))
  ) {
    return "Your session expired. Please sign in again.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Your email or password is incorrect.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  return fallbackMessage;
}
