import type { Metadata } from "next";
import { SettingsPageContent } from "@/components/SettingsPageContent";

export const metadata: Metadata = {
  title: "Settings | AI Job Interview Simulator",
  description: "Adjust dashboard settings, theme, and feedback preferences.",
};

export default function DashboardSettingsPage() {
  return <SettingsPageContent />;
}
