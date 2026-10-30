import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  prefix: text("prefix").notNull().default(""),
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

export const galleryExhibitions = pgTable("gallery_exhibitions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  coverUrl: text("cover_url"),
  venueName: text("venue_name").notNull().default(""),
  venueAddress: text("venue_address").notNull().default(""),
  venuePhone: text("venue_phone").notNull().default(""),
  venueEmail: text("venue_email").notNull().default(""),
  venueWebsite: text("venue_website").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  publicOpeningAt: timestamp("public_opening_at", { withTimezone: true }),
  submissionDeadline: timestamp("submission_deadline", { withTimezone: true }),
  status: text("status").notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  submissionsEnabled: boolean("submissions_enabled").notNull().default(false),
  createdBy: text("created_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const galleryExhibitionAlbums = pgTable("gallery_exhibition_albums", {
  exhibitionId: integer("exhibition_id").notNull(),
  albumId: integer("album_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const gallerySubmissions = pgTable("gallery_submissions", {
  id: serial("id").primaryKey(),
  exhibitionId: integer("exhibition_id").notNull(),
  artistName: text("artist_name").notNull(),
  artistEmail: text("artist_email").notNull(),
  artistPhone: text("artist_phone").notNull().default(""),
  artistBio: text("artist_bio").notNull().default(""),
  artistStatement: text("artist_statement").notNull().default(""),
  portfolioUrl: text("portfolio_url").notNull().default(""),
  socialHandles: text("social_handles").notNull().default(""),
  artworkTitle: text("artwork_title").notNull(),
  medium: text("medium").notNull().default(""),
  dimensions: text("dimensions").notNull().default(""),
  yearCreated: integer("year_created"),
  editionInfo: text("edition_info").notNull().default(""),
  askingPrice: text("asking_price").notNull().default(""),
  notForSale: boolean("not_for_sale").notNull().default(false),
  artworkDescription: text("artwork_description").notNull().default(""),
  imageUrls: jsonb("image_urls").notNull().default([]),
  status: text("status").notNull().default("submitted"),
  reviewNotes: text("review_notes").notNull().default(""),
  reviewerId: text("reviewer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const galleryExhibitionOccurrences = pgTable("gallery_exhibition_occurrences", {
  id: serial("id").primaryKey(),
  exhibitionId: integer("exhibition_id").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  recurrence: text("recurrence").notNull().default("none"),
  cancelled: boolean("cancelled").notNull().default(false),
})

export const galleryExhibitionRsvps = pgTable("gallery_exhibition_rsvps", {
  id: serial("id").primaryKey(),
  exhibitionId: integer("exhibition_id").notNull(),
  occurrenceId: integer("occurrence_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  guests: integer("guests").notNull().default(1),
  status: text("status").notNull().default("confirmed"),
  waitlistPosition: integer("waitlist_position"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// --- Employment: job postings & applications --------------------------------

export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  department: text("department").notNull().default(""),
  location: text("location").notNull().default(""),
  employmentType: text("employment_type").notNull().default("full_time"),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  requirements: text("requirements").notNull().default(""),
  benefits: text("benefits").notNull().default(""),
  payRange: text("pay_range").notNull().default(""),
  status: text("status").notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  applicationsEnabled: boolean("applications_enabled").notNull().default(true),
  closingDate: timestamp("closing_date", { withTimezone: true }),
  contactName: text("contact_name").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  availability: text("availability").notNull().default(""),
  desiredPay: text("desired_pay").notNull().default(""),
  startDate: text("start_date").notNull().default(""),
  yearsExperience: text("years_experience").notNull().default(""),
  referralSource: text("referral_source").notNull().default(""),
  coverLetter: text("cover_letter").notNull().default(""),
  resumeUrl: text("resume_url").notNull().default(""),
  resumeFilename: text("resume_filename").notNull().default(""),
  eligibleToWork: boolean("eligible_to_work").notNull().default(false),
  status: text("status").notNull().default("new"),
  reviewNotes: text("review_notes").notNull().default(""),
  reviewerId: text("reviewer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull().default("contact"),
  name: text("name").notNull().default(""),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  topic: text("topic").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  emailed: boolean("emailed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const calendarWorkspaces = pgTable("calendar_workspaces", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  document: jsonb("document").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const calendarHistory = pgTable("calendar_history", {
  id: serial("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  actorName: text("actor_name").notNull(),
  summary: text("summary").notNull(),
  document: jsonb("document").notNull(),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
