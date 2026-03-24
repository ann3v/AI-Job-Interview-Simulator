"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const params = new URLSearchParams({
        next: pathname || "/dashboard",
      });

      router.replace(`/login?${params.toString()}`);
    }
  }, [loading, pathname, router, user]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-linear-to-b from-zinc-100 via-white to-sky-50 px-4 py-8 font-sans text-zinc-950 sm:px-6 sm:py-10">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
            Checking your session...
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
