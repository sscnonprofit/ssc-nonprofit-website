"use client"

import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AuthShell } from "@/components/admin/auth-shell"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-3 text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/admin/reset-password" })
    setLoading(false)
    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.")
      return
    }
    setSent(true)
  }

  return (
    <AuthShell title="Reset your password" description="Enter your work email and we'll send you a link to choose a new password.">
      {sent ? (
        <div className="space-y-5">
          <p className="rounded-lg border border-border bg-muted px-4 py-4 text-sm leading-6" role="status">
            If an account exists for {email}, a reset link is on its way. It expires in one hour.
          </p>
          <Link href="/admin/sign-in" className="text-sm font-semibold underline-offset-4 hover:text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="email">Work email</FieldLabel>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 bg-background text-base" placeholder="you@sscnonprofit.org" />
            </Field>
            <ErrorNote message={error} />
            <Button type="submit" disabled={loading} className="h-12 w-full font-semibold">
              {loading && <Loader2Icon className="animate-spin" />}
              {loading ? "Sending..." : "Email me a reset link"}
            </Button>
            <Link href="/admin/sign-in" className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  )
}

export function ResetPasswordForm({ token, invalid }: { token: string | null; invalid: boolean }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) return
    if (password !== confirm) {
      setError("The passwords don't match.")
      return
    }
    setError(null)
    setLoading(true)
    const { error } = await authClient.resetPassword({ newPassword: password, token })
    setLoading(false)
    if (error) {
      setError(error.message ?? "This reset link is no longer valid. Request a new one.")
      return
    }
    router.push("/admin/sign-in")
  }

  if (!token || invalid) {
    return (
      <AuthShell title="Link expired" description="This password reset link is invalid or has expired.">
        <Link href="/admin/forgot-password" className="text-sm font-semibold underline-offset-4 hover:text-primary hover:underline">
          Request a new link
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" description="Use at least 8 characters.">
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 bg-background text-base" />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
            <Input id="confirm" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12 bg-background text-base" />
          </Field>
          <ErrorNote message={error} />
          <Button type="submit" disabled={loading} className="h-12 w-full font-semibold">
            {loading && <Loader2Icon className="animate-spin" />}
            {loading ? "Saving..." : "Update password"}
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
