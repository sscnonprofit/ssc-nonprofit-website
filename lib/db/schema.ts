import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  /** App-level authorization: "admin" can publish/manage users, "editor" can draft/edit content. */
  role: text("role").notNull().default("editor"),
  /** Suspended accounts cannot sign in and existing sessions are rejected. */
  disabled: boolean("disabled").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  // Required by Better Auth 1.7+: scopes account identity by issuer (e.g. the
  // credential provider's own domain for email/password accounts).
  issuer: text("issuer").notNull().default(""),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables: WordPress-like page CMS ------------------------------------
// `pages` holds one row per editable route. `content` is the live/published
// document; `draft_content` holds in-progress edits until an editor publishes.
// No foreign keys to `user` by design (see neon-on-vercel skill) — `updated_by`
// and `edited_by` are plain text columns storing the user id for display only.

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  draftContent: jsonb("draft_content"),
  status: text("status").notNull().default("published"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const pageRevisions = pgTable("page_revisions", {
  id: serial("id").primaryKey(),
  pageSlug: text("page_slug").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  editedBy: text("edited_by"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// --- Events & gallery --------------------------------------------------------

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("community"),
  location: text("location").notNull().default(""),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  allDay: boolean("all_day").notNull().default(false),
  image: text("image"),
  imageAlt: text("image_alt").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default(""),
  ctaUrl: text("cta_url").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull().default("draft"),
  capacity: integer("capacity"),
  rsvpEnabled: boolean("rsvp_enabled").notNull().default(false),
  recurrence: text("recurrence").notNull().default("none"),
  recurrenceUntil: timestamp("recurrence_until", { withTimezone: true }),
  exceptions: jsonb("exceptions").notNull().default([]),
  cost: text("cost").notNull().default(""),
  accessibility: text("accessibility").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  waitlistEnabled: boolean("waitlist_enabled").notNull().default(false),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  occurrence: text("occurrence").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  guests: integer("guests").notNull().default(1),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("confirmed"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const galleryAlbums = pgTable("gallery_albums", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  coverUrl: text("cover_url"),
  status: text("status").notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  eventId: integer("event_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const galleryPhotos = pgTable("gallery_photos", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull(),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
