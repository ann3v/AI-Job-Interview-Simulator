import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InterviewDashboard } from "@/components/interview/InterviewDashboard";

export const metadata: Metadata = {
  title: "Dashboard | AI Job Interview Simulator",
  description: "Protected interview practice dashboard for signed-in users.",
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <InterviewDashboard />
    </ProtectedRoute>
  );
}
