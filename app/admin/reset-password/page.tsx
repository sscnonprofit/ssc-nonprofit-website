import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/admin/password-reset-forms"

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } }

export default async function AdminResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams
  return <ResetPasswordForm token={token ?? null} invalid={Boolean(error)} />
}
