import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-linear-to-b from-zinc-100 via-white to-sky-50 px-4 py-8 font-sans text-zinc-950 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <DashboardHeader />
        {children}
      </div>
    </main>
  );
}
