import type { Metadata } from "next"

import { TwoFactorVerify } from "@/components/admin/two-factor-verify"

export const metadata: Metadata = { title: "Verify sign-in", robots: { index: false } }

export default function AdminVerifyPage() {
  return <TwoFactorVerify />
}
