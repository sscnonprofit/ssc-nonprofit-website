"use server"

import { and, asc, eq, ne } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/cms/auth-helpers"
import { isRole, type Role } from "@/lib/cms/roles"
import { db } from "@/lib/db"
import { session as sessionTable, user as userTable } from "@/lib/db/schema"

export type ManagedUser = {
  id: string
  name: string
  email: string
  role: string
  disabled: boolean
  createdAt: Date
}

export type UserActionResult = { ok: true } | { ok: false; error: string }

function cleanPrefix(value: string) {
  const prefix = value.trim()
  if (prefix.length > 20) throw new Error("Prefix must be 20 characters or fewer.")
  if (!/^[\p{L}\p{M}\d .,'’-]*$/u.test(prefix)) throw new Error("Use letters, numbers, spaces, or basic punctuation only.")
  return prefix
}

export async function updateProfilePrefixAction(prefixValue: string): Promise<UserActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Unauthorized")
    await db.update(userTable).set({ prefix: cleanPrefix(prefixValue), updatedAt: new Date() }).where(eq(userTable.id, session.user.id))
    revalidatePath("/admin/profile")
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to save your profile." }
  }
}

const MIN_PASSWORD_LENGTH = 8

async function safe(fn: () => Promise<void>): Promise<UserActionResult> {
  try {
    await fn()
    revalidatePath("/admin/users")
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong. Please try again." }
  }
}

function cleanName(value: string) {
  const name = value.trim()
  if (name.length < 2) throw new Error("Please enter a name of at least 2 characters.")
  if (name.length > 80) throw new Error("Name must be 80 characters or fewer.")
  return name
}

function cleanEmail(value: string) {
  const email = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.")
  return email
}

function cleanPassword(value: string) {
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }
  if (value.length > 128) throw new Error("Password must be 128 characters or fewer.")
  return value
}

function cleanRole(value: string): Role {
  if (!isRole(value)) throw new Error("Choose a valid role.")
  return value
}

/** True when `userId` is the only active admin, so removing their access would lock everyone out. */
async function isLastActiveAdmin(userId: string) {
  const others = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(and(eq(userTable.role, "admin"), eq(userTable.disabled, false), ne(userTable.id, userId)))
    .limit(1)
  return others.length === 0
}

async function getTarget(userId: string) {
  const [target] = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1)
  if (!target) throw new Error("User not found.")
  return target
}

async function revokeSessions(userId: string) {
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId))
}

export async function listUsersAction(): Promise<ManagedUser[]> {
  await requireAdmin()
  return db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
      disabled: userTable.disabled,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .orderBy(asc(userTable.createdAt))
}

export async function createUserAction(input: {
  name: string
  email: string
  password: string
  role: string
}): Promise<UserActionResult> {
  return safe(async () => {
    await requireAdmin()
    const name = cleanName(input.name)
    const email = cleanEmail(input.email)
    const password = cleanPassword(input.password)
    const role = cleanRole(input.role)

    const [existing] = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, email)).limit(1)
    if (existing) throw new Error("A user with that email already exists.")

    const result = await auth.api.signUpEmail({ body: { name, email, password } })
    const newUserId = result.user.id

    // Sign-up opens a session for the new account; the admin must stay signed in as themselves.
    await revokeSessions(newUserId)
    await db
      .update(userTable)
      .set({ role, emailVerified: true, updatedAt: new Date() })
      .where(eq(userTable.id, newUserId))
  })
}

export async function updateUserAction(
  userId: string,
  input: { name: string; email: string; role: string },
): Promise<UserActionResult> {
  return safe(async () => {
    const admin = await requireAdmin()
    const name = cleanName(input.name)
    const email = cleanEmail(input.email)
    const role = cleanRole(input.role)
    const target = await getTarget(userId)

    if (email !== target.email) {
      const [clash] = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, email)).limit(1)
      if (clash) throw new Error("Another user already uses that email.")
    }

    if (role !== target.role) {
      if (admin.id === userId) throw new Error("You cannot change your own role.")
      if (target.role === "admin" && (await isLastActiveAdmin(userId))) {
        throw new Error("At least one active admin is required.")
      }
    }

    await db.update(userTable).set({ name, email, role, updatedAt: new Date() }).where(eq(userTable.id, userId))
    if (role !== target.role) await revokeSessions(userId)
  })
}

export async function setUserDisabledAction(userId: string, disabled: boolean): Promise<UserActionResult> {
  return safe(async () => {
    const admin = await requireAdmin()
    if (admin.id === userId) throw new Error("You cannot suspend your own account.")
    const target = await getTarget(userId)
    if (disabled && target.role === "admin" && (await isLastActiveAdmin(userId))) {
      throw new Error("At least one active admin is required.")
    }

    await db.update(userTable).set({ disabled, updatedAt: new Date() }).where(eq(userTable.id, userId))
    if (disabled) await revokeSessions(userId)
  })
}

export async function resetUserPasswordAction(userId: string, newPassword: string): Promise<UserActionResult> {
  return safe(async () => {
    await requireAdmin()
    const password = cleanPassword(newPassword)
    await getTarget(userId)

    const ctx = await auth.$context
    const hash = await ctx.password.hash(password)
    await ctx.internalAdapter.updatePassword(userId, hash)
    await revokeSessions(userId)
  })
}

export async function signOutUserEverywhereAction(userId: string): Promise<UserActionResult> {
  return safe(async () => {
    await requireAdmin()
    await getTarget(userId)
    await revokeSessions(userId)
  })
}

export async function deleteUserAction(userId: string): Promise<UserActionResult> {
  return safe(async () => {
    const admin = await requireAdmin()
    if (admin.id === userId) throw new Error("You cannot delete your own account.")
    const target = await getTarget(userId)
    if (target.role === "admin" && (await isLastActiveAdmin(userId))) {
      throw new Error("At least one active admin is required.")
    }

    // Sessions and accounts are removed by ON DELETE CASCADE.
    await db.delete(userTable).where(eq(userTable.id, userId))
  })
}
