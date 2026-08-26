"use client"

import { useState, useTransition } from "react"

import { updateUserRoleAction } from "@/app/admin/actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type UserRow = {
  id: string
  name: string
  email: string
  role: string | null
  createdAt: Date
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "")
  return initials.join("") || "?"
}

export function UsersTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden grid-cols-[2fr_1fr_auto] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
        <span>User</span>
        <span>Joined</span>
        <span>Role</span>
      </div>
      <ul>
        {users.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
        ))}
      </ul>
    </div>
  )
}

function UserRow({ user, isSelf }: { user: UserRow; isSelf: boolean }) {
  const [role, setRole] = useState(user.role ?? "editor")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRoleChange(value: string | null) {
    if (!value) return
    const nextRole = value as "admin" | "editor"
    setError(null)
    startTransition(async () => {
      try {
        await updateUserRoleAction(user.id, nextRole)
        setRole(nextRole)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update role.")
      }
    })
  }

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[2fr_1fr_auto]">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9 shrink-0 border border-border">
          <AvatarFallback
            className={cn(
              "text-xs font-semibold",
              role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
      <p className="hidden text-sm text-muted-foreground sm:block">
        {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </p>
      {isSelf ? (
        <Badge variant="secondary" className="w-fit justify-self-end capitalize">
          {role} (you)
        </Badge>
      ) : (
        <Select value={role} onValueChange={handleRoleChange} disabled={isPending}>
          <SelectTrigger size="sm" className="w-28 justify-self-end">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </li>
  )
}
