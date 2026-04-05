import Image from "next/image";
import { getUserInitials } from "@/lib/user-profile";

type DashboardUserAvatarProps = {
  avatarDataUrl?: string | null;
  className?: string;
  displayName: string;
  email?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClassNameMap = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-2xl",
} as const;

const sizePixelMap = {
  sm: 40,
  md: 48,
  lg: 80,
} as const;

export function DashboardUserAvatar({
  avatarDataUrl,
  className,
  displayName,
  email,
  size = "md",
}: DashboardUserAvatarProps) {
  const initials = getUserInitials(displayName, email);
  const pixelSize = sizePixelMap[size];

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-sky-100 font-semibold text-sky-700 shadow-sm ${sizeClassNameMap[size]} ${className ?? ""}`.trim()}
    >
      {avatarDataUrl ? (
        <Image
          src={avatarDataUrl}
          alt={`${displayName} avatar`}
          fill
          sizes={`${pixelSize}px`}
          unoptimized
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
