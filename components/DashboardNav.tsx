"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-2"
      aria-label="Dashboard navigation"
    >
      {navigationItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border-sky-300 bg-sky-50 text-sky-800"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
