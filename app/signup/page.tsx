import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up | AI Job Interview Simulator",
  description: "Create an account to access the interview simulator dashboard.",
};

export default function SignupPage() {
  return <SignupForm />;
}
