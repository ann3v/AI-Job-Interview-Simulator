"use client";

import { useEffect, useState } from "react";
import { DashboardPageHeading } from "@/components/DashboardPageHeading";
import { DashboardUserAvatar } from "@/components/DashboardUserAvatar";
import { SectionCard } from "@/components/interview/SectionCard";
import { useAuth } from "@/context/AuthContext";
import { getUserDisplayName } from "@/lib/user-profile";

const inputClassName =
  "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

export function ProfilePageContent() {
  const { avatarDataUrl, updateAvatarDataUrl, updateDisplayName, user } =
    useAuth();
  const displayName = getUserDisplayName(user);
  const currentFullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(currentFullName);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    setName(currentFullName);
  }, [currentFullName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const normalizedName = name.trim();

    if (!normalizedName) {
      setSaveError("Please enter a name before saving.");
      setSaveStatus(null);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateDisplayName(normalizedName);
      setSaveStatus("Profile name updated.");
    } catch (profileError) {
      setSaveStatus(null);
      setSaveError(
        profileError instanceof Error
          ? profileError.message
          : "Unable to update your profile right now."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleAvatarSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    setAvatarError(null);
    setAvatarStatus(null);

    if (!selectedFile.type.startsWith("image/")) {
      setAvatarError("Please upload an image file.");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setAvatarError("Please choose an image smaller than 2MB.");
      return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        setAvatarError("Unable to read the selected image.");
        return;
      }

      try {
        updateAvatarDataUrl(reader.result);
        setAvatarStatus("Avatar updated on this device.");
      } catch (avatarStorageError) {
        setAvatarStatus(null);
        setAvatarError(
          avatarStorageError instanceof Error
            ? avatarStorageError.message
            : "Unable to save your avatar on this device. Please try again."
        );
      }
    });

    reader.addEventListener("error", () => {
      setAvatarError("Unable to read the selected image.");
    });

    reader.readAsDataURL(selectedFile);
  }

  function handleRemoveAvatar() {
    try {
      updateAvatarDataUrl(null);
      setAvatarError(null);
      setAvatarStatus("Avatar removed.");
    } catch (avatarStorageError) {
      setAvatarStatus(null);
      setAvatarError(
        avatarStorageError instanceof Error
          ? avatarStorageError.message
          : "Unable to remove your avatar on this device. Please try again."
      );
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeading
        eyebrow="Profile"
        title="Your profile"
        description="Update the name shown across the dashboard and optionally add a local avatar preview."
      />

      <div className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
        <SectionCard
          title="Avatar"
          subtitle="Upload a small image to personalize the dashboard. Avatar files are stored locally on this device for now."
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <DashboardUserAvatar
                avatarDataUrl={avatarDataUrl}
                displayName={displayName}
                email={user?.email}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-zinc-950">
                  {displayName}
                </p>
                <p className="truncate text-sm text-zinc-600">
                  {user?.email ?? "No email available"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800">
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelection}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={!avatarDataUrl}
                className="inline-flex items-center rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove
              </button>
            </div>

            {avatarError ? (
              <p className="text-sm text-red-600" role="alert">
                {avatarError}
              </p>
            ) : null}
            {avatarStatus ? (
              <p className="text-sm text-emerald-600" role="status">
                {avatarStatus}
              </p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Profile Details"
          subtitle="Keep your name current so it shows up consistently in the dashboard."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Add your full name"
                autoComplete="name"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email ?? ""}
                readOnly
                className={`${inputClassName} bg-zinc-50 text-zinc-600`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSaving || !name.trim() || name.trim() === currentFullName}
                className="inline-flex items-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <p className="text-sm text-zinc-600">
                Your email stays managed by authentication.
              </p>
            </div>

            {saveError ? (
              <p className="text-sm text-red-600" role="alert">
                {saveError}
              </p>
            ) : null}
            {saveStatus ? (
              <p className="text-sm text-emerald-600" role="status">
                {saveStatus}
              </p>
            ) : null}
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
