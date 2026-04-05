import type { Metadata } from "next";
import { InterviewDashboard } from "@/components/interview/InterviewDashboard";

export const metadata: Metadata = {
  title: "Dashboard | AI Job Interview Simulator",
  description: "Protected interview practice dashboard for signed-in users.",
};

export default function DashboardPage() {
  return <InterviewDashboard />;
}
