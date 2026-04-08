"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import {
  getFriendlyAuthErrorMessage,
  getSupabaseBrowserClient,
} from "@/lib/supabase";
import { getUserAvatarStorageKey } from "@/lib/user-profile";

type AuthContextValue = {
  avatarDataUrl: string | null;
  authError: string | null;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateAvatarDataUrl: (avatarDataUrl: string | null) => void;
  updateDisplayName: (fullName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredAvatarDataUrl(user: User | null) {
  if (!user || typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(getUserAvatarStorageKey(user.id));
  } catch (storageError) {
    console.error("Unable to read avatar from local storage:", storageError);
    return null;
  }
}

function getSupabaseClientOrThrow() {
  try {
    return getSupabaseBrowserClient();
  } catch (supabaseError) {
    throw new Error(getFriendlyAuthErrorMessage(supabaseError));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function initializeAuth() {
      let supabase: SupabaseClient;

      try {
        supabase = getSupabaseBrowserClient();
      } catch (supabaseError) {
        console.error("Failed to initialize Supabase client:", supabaseError);
        if (isActive) {
          setSession(null);
          setUser(null);
          setAvatarDataUrl(null);
          setAuthError(getFriendlyAuthErrorMessage(supabaseError));
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isActive) {
          return;
        }

        if (error) {
          console.error("Failed to restore Supabase session:", error.message);
          setSession(null);
          setUser(null);
          setAvatarDataUrl(null);
          setAuthError(getFriendlyAuthErrorMessage(error));
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setAvatarDataUrl(getStoredAvatarDataUrl(data.session?.user ?? null));
          setAuthError(null);
        }
      } catch (sessionRestoreError) {
        if (!isActive) {
          return;
        }

        console.error("Failed to restore Supabase session:", sessionRestoreError);
        setSession(null);
        setUser(null);
        setAvatarDataUrl(null);
        setAuthError(getFriendlyAuthErrorMessage(sessionRestoreError));
      }

      setLoading(false);
      const {
        data: { subscription: nextSubscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!isActive) {
          return;
        }

        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setAvatarDataUrl(getStoredAvatarDataUrl(nextSession?.user ?? null));
        setAuthError(null);
        setLoading(false);
      });

      subscription = nextSubscription;
    }

    void initializeAuth();

    return () => {
      isActive = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = getSupabaseClientOrThrow();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(getFriendlyAuthErrorMessage(error));
    }
  }

  function updateAvatarDataUrl(nextAvatarDataUrl: string | null) {
    if (!user) {
      setAvatarDataUrl(null);
      return;
    }

    const storageKey = getUserAvatarStorageKey(user.id);

    setAvatarDataUrl(nextAvatarDataUrl);

    try {
      if (nextAvatarDataUrl) {
        window.localStorage.setItem(storageKey, nextAvatarDataUrl);
        return;
      }

      window.localStorage.removeItem(storageKey);
    } catch (storageError) {
      console.error("Unable to update avatar in local storage:", storageError);
      setAvatarDataUrl(getStoredAvatarDataUrl(user));
      throw new Error(
        "Unable to save your avatar on this device. Please try again."
      );
    }
  }

  async function updateDisplayName(fullName: string) {
    const normalizedFullName = fullName.trim();

    if (!normalizedFullName) {
      throw new Error("Please enter a name before saving.");
    }

    if (!user) {
      throw new Error("You must be signed in to update your profile.");
    }

    const supabase = getSupabaseClientOrThrow();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...(typeof user.user_metadata === "object" && user.user_metadata
          ? user.user_metadata
          : {}),
        full_name: normalizedFullName,
      },
    });

    if (error) {
      throw new Error(getFriendlyAuthErrorMessage(error));
    }

    if (data.user) {
      setUser(data.user);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        avatarDataUrl,
        authError,
        user,
        session,
        loading,
        signOut,
        updateAvatarDataUrl,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
