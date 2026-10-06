"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, ImageIcon, SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfilePrefixAction } from "@/app/admin/user-actions"
import { authClient } from "@/lib/auth-client"

export function ProfileSettings({ initialPrefix = "" }: { initialPrefix?: string }) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [name, setName] = useState(session?.user.name ?? "")
  const [image, setImage] = useState(session?.user.image ?? "")
  const [prefix, setPrefix] = useState(initialPrefix)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus(null)
    const [authResult, prefixResult] = await Promise.all([
      authClient.updateUser({ name: name.trim(), image: image.trim() || null }),
      updateProfilePrefixAction(prefix),
    ])
    if (authResult.error || !prefixResult.ok) {
      setStatus(authResult.error?.message ?? (!prefixResult.ok ? prefixResult.error : "Unable to save your profile."))
    } else {
      setStatus("Profile saved")
      router.refresh()
    }
    setSaving(false)
  }

  const displayName = session?.user.name || name || "Your profile"
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary/10 text-xl font-semibold text-primary">
          {image ? <img src={image} alt="" className="size-full object-cover" /> : initials}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-foreground">{displayName}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Customize the identity shown in your account and admin workspace.</p>
        </div>
      </div>

      <div className="grid gap-5 rounded-xl border border-border bg-card p-5">
        <div className="grid gap-2">
          <Label htmlFor="profile-name">Display name</Label>
          <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required className="h-11 text-base" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profile-prefix">Name prefix</Label>
          <Input id="profile-prefix" value={prefix} onChange={(event) => setPrefix(event.target.value)} maxLength={20} placeholder="Dr., Rev., Prof." className="h-11 text-base" />
          <p className="text-sm leading-relaxed text-muted-foreground">Optional prefix displayed before your name.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profile-image">Avatar image URL</Label>
          <div className="relative">
            <ImageIcon className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input id="profile-image" type="url" value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://example.com/avatar.jpg" className="h-11 pl-9 text-base" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">Use a secure image URL. Your avatar is shown in your account menu.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={saving} className="h-11 w-full sm:w-auto"><SaveIcon className="size-4" />{saving ? "Saving…" : "Save profile"}</Button>
        {status && <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">{status === "Profile saved" && <CheckIcon className="size-4 text-emerald-600" />}{status}</p>}
      </div>
    </form>
  )
}
