import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminAuthForm } from "@/components/admin/auth-form"
import { auth } from "@/lib/auth"

export default async function AdminSignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/admin")

  return <AdminAuthForm mode="sign-up" />
}
