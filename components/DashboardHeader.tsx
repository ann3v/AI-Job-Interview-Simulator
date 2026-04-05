"use client";

import { DashboardNav } from "@/components/DashboardNav";
import { DashboardUserMenu } from "@/components/DashboardUserMenu";
import { Pill } from "@/components/interview/Pill";
import { useAuth } from "@/context/AuthContext";
import { getUserDisplayName } from "@/lib/user-profile";

export function DashboardHeader() {
  const { user } = useAuth();
  const displayName = getUserDisplayName(user);

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">Protected Dashboard</Pill>
            <Pill>{displayName}</Pill>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              AI Job Interview Simulator
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
              Practice interviews, manage your profile, and adjust your
              dashboard settings from one clean workspace.
            </p>
          </div>
        </div>

        <DashboardUserMenu />
      </div>

      <div className="mt-6">
        <DashboardNav />
      </div>
    </section>
  );
}
