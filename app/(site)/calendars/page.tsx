import type { Metadata } from "next";
import { CalendarWorkspace } from "@/components/calendars/calendar-workspace";
import { publishedWorkspace } from "@/lib/calendars/service";

export const metadata: Metadata = {
  title: "Activities & Healthcare Calendars",
  description:
    "Explore published SSC activity and healthcare calendars, accessible daily agendas and printable monthly schedules for Willow Lane, Hickory, Maple and Oak.",
};
export const dynamic = "force-dynamic";
export default async function CalendarsPage() {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 sm:py-16">
      <CalendarWorkspace initial={await publishedWorkspace()} />
    </section>
  );
}
