import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up | AI Job Interview Simulator",
  description: "Create an account to save sessions and track your interview progress.",
};

export default function SignupPage() {
  return <SignupForm />;
}
