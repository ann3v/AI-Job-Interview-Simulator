"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getUserAvatarStorageKey } from "@/lib/user-profile";

type AuthContextValue = {
  avatarDataUrl: string | null;
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

  return window.localStorage.getItem(getUserAvatarStorageKey(user.id));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const supabase = getSupabaseBrowserClient();

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Failed to restore Supabase session:", error.message);
        setSession(null);
        setUser(null);
        setAvatarDataUrl(null);
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setAvatarDataUrl(getStoredAvatarDataUrl(data.session?.user ?? null));
      }

      setLoading(false);
    }

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAvatarDataUrl(getStoredAvatarDataUrl(nextSession?.user ?? null));
      setLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }

  function updateAvatarDataUrl(nextAvatarDataUrl: string | null) {
    if (!user) {
      setAvatarDataUrl(null);
      return;
    }

    const storageKey = getUserAvatarStorageKey(user.id);

    setAvatarDataUrl(nextAvatarDataUrl);

    if (nextAvatarDataUrl) {
      window.localStorage.setItem(storageKey, nextAvatarDataUrl);
      return;
    }

    window.localStorage.removeItem(storageKey);
  }

  async function updateDisplayName(fullName: string) {
    const normalizedFullName = fullName.trim();

    if (!normalizedFullName) {
      throw new Error("Please enter a name before saving.");
    }

    if (!user) {
      throw new Error("You must be signed in to update your profile.");
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...(typeof user.user_metadata === "object" && user.user_metadata
          ? user.user_metadata
          : {}),
        full_name: normalizedFullName,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      setUser(data.user);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        avatarDataUrl,
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
