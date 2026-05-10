"use client";

import { DashboardPageHeading } from "@/components/DashboardPageHeading";
import { FeedbackForm } from "@/components/FeedbackForm";
import { SectionCard } from "@/components/interview/SectionCard";
import { useTheme } from "@/context/ThemeContext";

export function SettingsPageContent() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="space-y-6">
      <DashboardPageHeading
        eyebrow="Settings"
        title="Preferences"
        description="Choose a theme and send product feedback from one place."
      />

      <SectionCard
        title="Theme"
        subtitle="Pick the dashboard appearance for this browser."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {(["light", "dark"] as const).map((themeOption) => {
              const isActive = theme === themeOption;

              return (
                <button
                  key={themeOption}
                  type="button"
                  onClick={() => setTheme(themeOption)}
                  aria-pressed={isActive}
                  className={`inline-flex min-w-28 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold capitalize transition ${
                    isActive
                      ? "border-sky-300 bg-sky-50 text-sky-800"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  {themeOption}
                </button>
              );
            })}
          </div>
          <p className="text-sm leading-6 text-zinc-600">
            Theme preference is saved locally so it stays consistent on this
            device.
          </p>
        </div>
      </SectionCard>

      <section id="feedback" className="scroll-mt-6">
        <SectionCard
          title="Send Feedback"
          subtitle="Share product notes, missing features, or anything that slowed you down."
        >
          <FeedbackForm />
        </SectionCard>
      </section>
    </div>
  );
}
