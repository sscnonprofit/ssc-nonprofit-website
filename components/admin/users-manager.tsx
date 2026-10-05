"use client"

import { useMemo, useState, useTransition } from "react"
import {
  BanIcon,
  CheckIcon,
  KeyRoundIcon,
  Loader2Icon,
  LogOutIcon,
  MoreVerticalIcon,
  PencilIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  createUserAction,
  deleteUserAction,
  resetUserPasswordAction,
  setUserDisabledAction,
  signOutUserEverywhereAction,
  updateUserAction,
  type ManagedUser,
  type UserActionResult,
} from "@/app/admin/user-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PERMISSION_LABELS, ROLES, ROLE_DETAILS, type Role } from "@/lib/cms/roles"
import { cn } from "@/lib/utils"

type DialogState =
  | { type: "create" }
  | { type: "edit"; user: ManagedUser }
  | { type: "password"; user: ManagedUser }
  | { type: "suspend"; user: ManagedUser }
  | { type: "delete"; user: ManagedUser }
  | { type: "signout"; user: ManagedUser }
  | null

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  )
}

export function UsersManager({ users, currentUserId }: { users: ManagedUser[]; currentUserId: string }) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all")

  const counts = useMemo(
    () => ({
      total: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      editor: users.filter((u) => u.role === "editor").length,
      viewer: users.filter((u) => u.role === "viewer").length,
      suspended: users.filter((u) => u.disabled).length,
    }),
    [users],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (!q) return true
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
  }, [users, query, roleFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-balance font-serif text-2xl font-semibold tracking-tight">Users and permissions</h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Add team members, choose what each person can do, and remove access when someone leaves.
          </p>
        </div>
        <Button className="h-11 w-full sm:h-9 sm:w-auto" onClick={() => setDialog({ type: "create" })}>
          <UserPlusIcon data-icon="inline-start" />
          Add user
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total users" value={counts.total} />
        <Stat label="Admins" value={counts.admin} />
        <Stat label="Editors and viewers" value={counts.editor + counts.viewer} />
        <Stat label="Suspended" value={counts.suspended} />
      </dl>

      <section aria-label="Role permissions" className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheckIcon className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">What each role can do</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {ROLES.map((role) => (
            <div key={role} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{ROLE_DETAILS[role].label}</span>
                <span className="text-xs text-muted-foreground">{counts[role]} users</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{ROLE_DETAILS[role].description}</p>
              <ul className="flex flex-col gap-1">
                {ROLE_DETAILS[role].permissions.map((permission) => (
                  <li key={permission} className="flex items-start gap-1.5 text-xs">
                    <CheckIcon className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
                    {PERMISSION_LABELS[permission]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Team members" className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search users"
              className="h-11 pl-9 text-base sm:h-9 sm:text-sm"
            />
          </div>
          <div role="group" aria-label="Filter by role" className="flex gap-1 overflow-x-auto">
            {(["all", ...ROLES] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={roleFilter === value}
                onClick={() => setRoleFilter(value)}
                className={cn(
                  "h-11 shrink-0 rounded-lg border border-border px-3 text-sm capitalize transition-colors sm:h-9",
                  roleFilter === value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {visible.map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} onAction={setDialog} />
          ))}
        </ul>
        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No users match your search.
          </p>
        )}
      </section>

      <UserFormDialog
        key={dialog?.type === "edit" ? dialog.user.id : dialog?.type === "create" ? "create" : "closed"}
        state={dialog?.type === "create" || dialog?.type === "edit" ? dialog : null}
        isSelf={dialog?.type === "edit" && dialog.user.id === currentUserId}
        onClose={() => setDialog(null)}
      />
      <PasswordDialog
        user={dialog?.type === "password" ? dialog.user : null}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        state={dialog?.type === "suspend" || dialog?.type === "delete" || dialog?.type === "signout" ? dialog : null}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

function UserRow({
  user,
  isSelf,
  onAction,
}: {
  user: ManagedUser
  isSelf: boolean
  onAction: (state: DialogState) => void
}) {
  const role = ROLE_DETAILS[user.role as Role]
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm",
        user.disabled && "bg-muted/50",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary",
          user.disabled && "bg-muted text-muted-foreground",
        )}
      >
        {initials(user.name)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn("truncate text-sm font-semibold", user.disabled && "text-muted-foreground")}>
            {user.name}
          </span>
          {isSelf && <Badge variant="outline">You</Badge>}
        </div>
        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>{role?.label ?? user.role}</Badge>
          {user.disabled && (
            <Badge variant="outline" className="gap-1 text-destructive">
              <BanIcon className="size-3" />
              Suspended
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">Added {dateFormat.format(new Date(user.createdAt))}</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-11 shrink-0 sm:size-9" />}>
          <MoreVerticalIcon className="size-4" />
          <span className="sr-only">Actions for {user.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem className="min-h-11 sm:min-h-8" onClick={() => onAction({ type: "edit", user })}>
              <PencilIcon />
              Edit details and role
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 sm:min-h-8" onClick={() => onAction({ type: "password", user })}>
              <KeyRoundIcon />
              Reset password
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 sm:min-h-8" onClick={() => onAction({ type: "signout", user })}>
              <LogOutIcon />
              Sign out everywhere
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="min-h-11 sm:min-h-8" onClick={() => onAction({ type: "suspend", user })}>
                  <BanIcon />
                  {user.disabled ? "Restore access" : "Suspend access"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="min-h-11 text-destructive sm:min-h-8"
                  onClick={() => onAction({ type: "delete", user })}
                >
                  <Trash2Icon />
                  Delete user
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

function useActionRunner(onDone: () => void) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<UserActionResult>, successMessage: string) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) return setError(result.error)
      toast.success(successMessage)
      onDone()
    })
  }

  return { error, setError, pending, run }
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  )
}

function RolePicker({
  value,
  onChange,
  disabled,
}: {
  value: Role
  onChange: (role: Role) => void
  disabled?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="Role" className="flex flex-col gap-2">
      {ROLES.map((role) => (
        <button
          key={role}
          type="button"
          role="radio"
          aria-checked={value === role}
          disabled={disabled}
          onClick={() => onChange(role)}
          className={cn(
            "flex min-h-11 flex-col gap-0.5 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
            value === role && "border-primary bg-primary/5 ring-1 ring-primary",
          )}
        >
          <span className="text-sm font-medium">{ROLE_DETAILS[role].label}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">{ROLE_DETAILS[role].description}</span>
        </button>
      ))}
    </div>
  )
}

function UserFormDialog({
  state,
  isSelf,
  onClose,
}: {
  state: { type: "create" } | { type: "edit"; user: ManagedUser } | null
  isSelf: boolean
  onClose: () => void
}) {
  const editing = state?.type === "edit" ? state.user : null
  const [name, setName] = useState(editing?.name ?? "")
  const [email, setEmail] = useState(editing?.email ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>((editing?.role as Role) ?? "editor")
  const { error, pending, run } = useActionRunner(onClose)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      run(() => updateUserAction(editing.id, { name, email, role }), "User updated")
    } else {
      run(() => createUserAction({ name, email, password, role }), "User created")
    }
  }

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add a user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update their details or change what they can do. Changing a role signs them out so it takes effect right away."
                : "Create an account and share the password with them securely. They can sign in right away."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-name">Full name</Label>
            <Input id="user-name" value={name} required maxLength={80} autoComplete="off" className="h-11 text-base sm:h-9 sm:text-sm" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" value={email} required autoComplete="off" className="h-11 text-base sm:h-9 sm:text-sm" onChange={(e) => setEmail(e.target.value)} />
          </div>
          {!editing && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-password">Temporary password</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11 text-base sm:h-9 sm:text-sm"
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">At least 8 characters.</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <RolePicker value={role} onChange={setRole} disabled={isSelf} />
            {isSelf && <span className="text-xs text-muted-foreground">You cannot change your own role.</span>}
          </div>

          <ErrorMessage message={error} />

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="h-11 sm:h-9" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="h-11 sm:h-9" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PasswordDialog({ user, onClose }: { user: ManagedUser | null; onClose: () => void }) {
  const [password, setPassword] = useState("")
  const { error, pending, run } = useActionRunner(() => {
    setPassword("")
    onClose()
  })

  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (user) run(() => resetUserPasswordAction(user.id, password), "Password reset")
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for {user?.name}. They will be signed out on all devices.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              value={password}
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11 text-base sm:h-9 sm:text-sm"
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">At least 8 characters.</span>
          </div>
          <ErrorMessage message={error} />
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="h-11 sm:h-9" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="h-11 sm:h-9" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              Reset password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDialog({
  state,
  onClose,
}: {
  state: { type: "suspend" | "delete" | "signout"; user: ManagedUser } | null
  onClose: () => void
}) {
  const { error, pending, run } = useActionRunner(onClose)
  if (!state) return <Dialog open={false} onOpenChange={() => {}} />

  const { type, user } = state
  const restoring = type === "suspend" && user.disabled

  const copy = {
    delete: {
      title: `Delete ${user.name}?`,
      description: "This permanently removes the account and signs them out. Pages they created are kept. This cannot be undone.",
      confirm: "Delete user",
      destructive: true,
      success: "User deleted",
      action: () => deleteUserAction(user.id),
    },
    suspend: restoring
      ? {
          title: `Restore access for ${user.name}?`,
          description: "They will be able to sign in again with their existing password.",
          confirm: "Restore access",
          destructive: false,
          success: "Access restored",
          action: () => setUserDisabledAction(user.id, false),
        }
      : {
          title: `Suspend ${user.name}?`,
          description: "They are signed out immediately and cannot sign in until you restore access. Nothing is deleted.",
          confirm: "Suspend access",
          destructive: true,
          success: "User suspended",
          action: () => setUserDisabledAction(user.id, true),
        },
    signout: {
      title: `Sign ${user.name} out everywhere?`,
      description: "Ends all of their active sessions. They can sign in again with their password.",
      confirm: "Sign out",
      destructive: false,
      success: "Signed out on all devices",
      action: () => signOutUserEverywhereAction(user.id),
    },
  }[type]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <ErrorMessage message={error} />
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" className="h-11 sm:h-9" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={copy.destructive ? "destructive" : "default"}
            className="h-11 sm:h-9"
            disabled={pending}
            onClick={() => run(copy.action, copy.success)}
          >
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
