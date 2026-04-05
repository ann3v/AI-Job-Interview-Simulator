import type { Metadata } from "next";
import { ProfilePageContent } from "@/components/ProfilePageContent";

export const metadata: Metadata = {
  title: "Profile | AI Job Interview Simulator",
  description: "Manage your dashboard profile details and avatar.",
};

export default function DashboardProfilePage() {
  return <ProfilePageContent />;
}
