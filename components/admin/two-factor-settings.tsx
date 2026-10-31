"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export function TwoFactorSettings({ initialEnabled, email }: { initialEnabled: boolean; email: string }) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function toggle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setStatus(null)
    const { error } = enabled
      ? await authClient.twoFactor.disable({ password })
      : await authClient.twoFactor.enable({ password })
    if (error) {
      setStatus(error.message ?? "Unable to update two-factor authentication.")
    } else {
      setEnabled(!enabled)
      setPassword("")
      setStatus(enabled ? "Two-factor authentication turned off." : "Two-factor authentication turned on.")
      router.refresh()
    }
    setPending(false)
  }

  return (
    <form onSubmit={toggle} className="grid gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Two-factor authentication</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {enabled
              ? `On. We email a one-time code to ${email} each time you sign in on a new device.`
              : `Off. Turn it on and we will email a one-time code to ${email} whenever you sign in on a new device.`}
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="two-factor-password">Confirm your password</Label>
        <Input
          id="two-factor-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="h-11 text-base"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={pending || !password} variant={enabled ? "outline" : "default"} className="h-11 w-full sm:w-auto">
          {pending ? "Working…" : enabled ? "Turn off two-factor" : "Turn on two-factor"}
        </Button>
        {status && (
          <p className="text-sm text-muted-foreground" role="status">
            {status}
          </p>
        )}
      </div>
    </form>
  )
}
