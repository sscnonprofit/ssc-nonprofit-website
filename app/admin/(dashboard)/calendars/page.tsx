import type { Metadata } from "next";
import { CalendarWorkspace } from "@/components/calendars/calendar-workspace";
import { adminWorkspace } from "@/lib/calendars/service";

export const metadata: Metadata = { title: "Calendar Builder" };
export const dynamic = "force-dynamic";
export default async function CalendarBuilderPage() {
  return <CalendarWorkspace initial={await adminWorkspace()} admin />;
}
