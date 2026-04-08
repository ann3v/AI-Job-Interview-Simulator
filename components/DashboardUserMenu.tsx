"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserDisplayName } from "@/lib/user-profile";
import { DashboardUserAvatar } from "@/components/DashboardUserAvatar";

const menuItems = [
  {
    href: "/dashboard/profile",
    label: "Profile",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
  },
  {
    href: "/dashboard/settings#feedback",
    label: "Send Feedback",
  },
];

export function DashboardUserMenu() {
  const { avatarDataUrl, signOut, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const displayName = getUserDisplayName(user);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  async function handleSignOut() {
    if (pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      await signOut();
      setIsOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Unable to sign out right now."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="inline-flex items-center gap-3 rounded-full border border-zinc-300 bg-white px-3 py-2 text-left shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <DashboardUserAvatar
          avatarDataUrl={avatarDataUrl}
          displayName={displayName}
          email={user?.email}
          size="sm"
        />
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-semibold text-zinc-950">
            {displayName}
          </span>
          <span className="block truncate text-xs text-zinc-600">
            {user?.email ?? "Signed in"}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-zinc-500 transition ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M5.25 7.5 10 12.25 14.75 7.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 z-20 mt-3 w-72 rounded-[1.5rem] border border-zinc-200 bg-white p-2 shadow-xl"
          role="menu"
        >
          <div className="flex items-center gap-3 rounded-[1.25rem] bg-zinc-50 px-3 py-3">
            <DashboardUserAvatar
              avatarDataUrl={avatarDataUrl}
              displayName={displayName}
              email={user?.email}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">
                {displayName}
              </p>
              <p className="truncate text-sm text-zinc-600">
                {user?.email ?? "Signed in"}
              </p>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
                role="menuitem"
              >
                {item.label}
                <span aria-hidden="true" className="text-zinc-400">
                  →
                </span>
              </Link>
            ))}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={pending}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70"
              role="menuitem"
            >
              {pending ? "Signing out..." : "Logout"}
              <span aria-hidden="true" className="text-zinc-400">
                ↗
              </span>
            </button>
          </div>

          {error ? (
            <p className="px-3 pb-2 pt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
