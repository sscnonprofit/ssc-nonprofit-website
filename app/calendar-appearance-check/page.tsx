"use client";

import { useState } from "react";
import { CalendarAppearanceControls } from "@/components/calendars/calendar-appearance";
import { CalendarView } from "@/components/calendars/calendar-view";
import { novemberSeed } from "@/lib/calendars/seed";
import { occurrences, type Calendar } from "@/lib/calendars/model";

export default function AppearanceCheck() {
  const [doc] = useState(novemberSeed);
  const [calendar, setCalendar] = useState<Calendar>(doc.calendars[0]);
  const document = { ...doc, calendars: [calendar, ...doc.calendars.slice(1)] };
  return <main className="flex flex-col gap-6 bg-background p-6 font-sans text-foreground">
    <h1 className="text-2xl font-semibold">Isolated appearance interaction check</h1>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <form onSubmit={(e) => e.preventDefault()}><CalendarAppearanceControls calendar={calendar} document={document} onChange={setCalendar} /></form>
      <CalendarView document={document} month="2026-11" events={occurrences(doc, "2026-11").filter((e) => e.calendarIds.includes(calendar.id))} notes={[]} calendarId={calendar.id} onEvent={() => {}} />
    </div>
  </main>;
}
