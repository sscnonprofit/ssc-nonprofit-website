import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/admin/password-reset-forms"

export const metadata: Metadata = { title: "Reset password", robots: { index: false } }

export default function AdminForgotPasswordPage() {
  return <ForgotPasswordForm />
}
