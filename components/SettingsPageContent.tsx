"use client";

import { useState } from "react";
import { DashboardPageHeading } from "@/components/DashboardPageHeading";
import { FeedbackForm } from "@/components/FeedbackForm";
import { SectionCard } from "@/components/interview/SectionCard";
import { useTheme } from "@/context/ThemeContext";

const inputClassName =
  "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

export function SettingsPageContent() {
  const { setTheme, theme } = useTheme();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({
    confirmPassword: "",
    currentPassword: "",
    newPassword: "",
  });

  function handlePasswordFieldChange(
    field: "confirmPassword" | "currentPassword" | "newPassword",
    value: string
  ) {
    setPasswords((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  }

  function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);

    if (
      !passwords.currentPassword.trim() ||
      !passwords.newPassword.trim() ||
      !passwords.confirmPassword.trim()
    ) {
      setPasswordStatus(null);
      setPasswordError("Fill in all password fields to continue.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordStatus(null);
      setPasswordError("New password and confirmation must match.");
      return;
    }

    setPasswordStatus(
      "Password change UI is ready, but the backend submission is not connected yet."
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeading
        eyebrow="Settings"
        title="Preferences and access"
        description="Choose a theme, review password settings, and send product feedback from one place."
      />

      <div className="grid gap-6 xl:grid-cols-[0.45fr_0.55fr]">
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

        <SectionCard
          title="Password"
          subtitle="The interface is in place for password updates while backend wiring is still pending."
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="currentPassword"
                className="text-sm font-medium text-zinc-700"
              >
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={passwords.currentPassword}
                onChange={(event) =>
                  handlePasswordFieldChange("currentPassword", event.target.value)
                }
                autoComplete="current-password"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-zinc-700"
              >
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={(event) =>
                  handlePasswordFieldChange("newPassword", event.target.value)
                }
                autoComplete="new-password"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-zinc-700"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={(event) =>
                  handlePasswordFieldChange("confirmPassword", event.target.value)
                }
                autoComplete="new-password"
                className={inputClassName}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Save Password
              </button>
              <p className="text-sm text-zinc-600">
                Submitting this currently shows a placeholder state only.
              </p>
            </div>

            {passwordError ? (
              <p className="text-sm text-red-600" role="alert">
                {passwordError}
              </p>
            ) : null}
            {passwordStatus ? (
              <p className="text-sm text-amber-600" role="status">
                {passwordStatus}
              </p>
            ) : null}
          </form>
        </SectionCard>
      </div>

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
