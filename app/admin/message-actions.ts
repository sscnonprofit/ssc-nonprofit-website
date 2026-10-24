"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { db } from "@/lib/db"
import { contactMessages } from "@/lib/db/schema"

type Result = { ok: true } | { ok: false; error: string }

const STATUSES = ["new", "handled"]

export async function setMessageStatusAction(id: number, status: string): Promise<Result> {
  await requireEditor()
  if (!Number.isInteger(id) || !STATUSES.includes(status)) return { ok: false, error: "Invalid request." }
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id))
  revalidatePath("/admin/messages")
  revalidatePath("/admin", "layout")
  return { ok: true }
}

export async function deleteMessageAction(id: number): Promise<Result> {
  await requireAdmin()
  if (!Number.isInteger(id)) return { ok: false, error: "Invalid request." }
  await db.delete(contactMessages).where(eq(contactMessages.id, id))
  revalidatePath("/admin/messages")
  revalidatePath("/admin", "layout")
  return { ok: true }
}
