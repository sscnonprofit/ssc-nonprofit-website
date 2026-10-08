import "server-only"

import { and, count, eq, gte, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  eventRsvps,
  events,
  galleryAlbums,
  galleryExhibitions,
  gallerySubmissions,
  jobApplications,
  jobPostings,
} from "@/lib/db/schema"
import { PUBLIC_EXHIBITION_STATUSES } from "@/lib/gallery/exhibition-constants"

export type FeatureOverview = {
  events: { upcoming: number; drafts: number; waitlisted: number }
  gallery: { published: number; drafts: number }
  exhibitions: { live: number; drafts: number; newSubmissions: number }
  jobs: { open: number; drafts: number; newApplications: number }
}

async function total(query: PromiseLike<{ value: number }[]>) {
  const [row] = await query
  return Number(row?.value ?? 0)
}

/** Live counts for the dashboard overview cards. Any single failure degrades to zero. */
export async function getFeatureOverview(): Promise<FeatureOverview> {
  const now = new Date()

  const [
    upcoming,
    eventDrafts,
    waitlisted,
    albumsLive,
    albumDrafts,
    exhibitionsLive,
    exhibitionDrafts,
    newSubmissions,
    jobsOpen,
    jobDrafts,
    newApplications,
  ] = await Promise.all([
    total(db.select({ value: count() }).from(events).where(and(eq(events.status, "published"), gte(events.startAt, now)))),
    total(db.select({ value: count() }).from(events).where(eq(events.status, "draft"))),
    total(db.select({ value: count() }).from(eventRsvps).where(eq(eventRsvps.status, "waitlist"))),
    total(db.select({ value: count() }).from(galleryAlbums).where(eq(galleryAlbums.status, "published"))),
    total(db.select({ value: count() }).from(galleryAlbums).where(eq(galleryAlbums.status, "draft"))),
    total(
      db
        .select({ value: count() })
        .from(galleryExhibitions)
        .where(inArray(galleryExhibitions.status, PUBLIC_EXHIBITION_STATUSES))
    ),
    total(db.select({ value: count() }).from(galleryExhibitions).where(eq(galleryExhibitions.status, "draft"))),
    total(db.select({ value: count() }).from(gallerySubmissions).where(eq(gallerySubmissions.status, "submitted"))),
    total(db.select({ value: count() }).from(jobPostings).where(eq(jobPostings.status, "open"))),
    total(db.select({ value: count() }).from(jobPostings).where(eq(jobPostings.status, "draft"))),
    total(db.select({ value: count() }).from(jobApplications).where(eq(jobApplications.status, "new"))),
  ]).catch(() => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

  return {
    events: { upcoming, drafts: eventDrafts, waitlisted },
    gallery: { published: albumsLive, drafts: albumDrafts },
    exhibitions: { live: exhibitionsLive, drafts: exhibitionDrafts, newSubmissions },
    jobs: { open: jobsOpen, drafts: jobDrafts, newApplications },
  }
}
