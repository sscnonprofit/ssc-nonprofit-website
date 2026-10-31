"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2Icon, MailCheckIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AuthShell } from "@/components/admin/auth-shell"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export function TwoFactorVerify() {
  const router = useRouter()
  const requested = useRef(false)
  const [code, setCode] = useState("")
  const [trustDevice, setTrustDevice] = useState(true)
  const [status, setStatus] = useState<"sending" | "ready" | "failed">("sending")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const sendCode = async () => {
    setStatus("sending")
    setError(null)
    const { error } = await authClient.twoFactor.sendOtp()
    if (error) {
      setStatus("failed")
      setError(error.message ?? "We couldn't send your code. Please sign in again.")
      return
    }
    setStatus("ready")
  }

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    void sendCode()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.twoFactor.verifyOtp({ code: code.trim(), trustDevice })
    setLoading(false)
    if (error) {
      setError(error.message ?? "That code didn't work. Please try again.")
      return
    }
    router.push("/admin")
    router.refresh()
  }

  return (
    <AuthShell title="Check your email" description="We emailed a 6-digit sign-in code to your work address. It expires in 5 minutes.">
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="code">Sign-in code</FieldLabel>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              required
              className="h-12 bg-background text-center font-mono text-xl tracking-[0.4em]"
              placeholder="000000"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={trustDevice} onCheckedChange={(value) => setTrustDevice(value === true)} />
            Trust this device for 30 days
          </label>
          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading || code.length < 6} className="h-12 w-full font-semibold">
            {loading ? <Loader2Icon className="animate-spin" /> : <MailCheckIcon />}
            {loading ? "Verifying..." : "Verify and continue"}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={sendCode} disabled={status === "sending"} className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline disabled:opacity-60">
              {status === "sending" ? "Sending code..." : "Resend code"}
            </button>
            <Link href="/admin/sign-in" className="text-muted-foreground underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </div>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
