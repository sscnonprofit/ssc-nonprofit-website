"use client";

import { Plus, MapPin, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  daysInMonth,
  forCalendar,
  timeLabel,
  type CalendarDocument,
  type CalendarEvent,
  type DayNote,
} from "@/lib/calendars/model";
import { cn } from "@/lib/utils";

export function CalendarView({
  document: doc,
  month,
  events,
  notes,
  calendarId,
  onEvent,
  onDay,
  onMove,
  large = false,
}: {
  document: CalendarDocument;
  month: string;
  events: CalendarEvent[];
  notes: DayNote[];
  calendarId: string;
  onEvent: (event: CalendarEvent) => void;
  onDay?: (date: string) => void;
  onMove?: (event: CalendarEvent, date: string) => void;
  large?: boolean;
}) {
  const days = daysInMonth(month);
  const offset = new Date(`${month}-01T12:00:00Z`).getUTCDay();
  function dayEvents(date: string) {
    return events
      .filter((e) => e.date === date && e.title)
      .map((e) => (calendarId === "all" ? e : forCalendar(e, calendarId)))
      .sort((a, b) =>
        (a.allDay ? "" : a.time).localeCompare(b.allDay ? "" : b.time),
      );
  }
  function eventButton(e: CalendarEvent, compact = false) {
    const location = doc.locations.find((l) => l.id === e.locationId);
    return (
      <button
        key={e.id}
        type="button"
        draggable={!!onMove}
        onDragStart={(ev) => {
          ev.dataTransfer.setData("text/plain", e.id);
        }}
        onClick={() => onEvent(e)}
        className={cn(
          "cal-event flex min-h-11 w-full flex-col gap-1 rounded-lg text-left outline-offset-4 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
          compact ? "p-1.5" : "p-3",
          e.banner && "bg-primary/10 text-primary",
          e.cancelled && "text-muted-foreground",
          large ? "text-lg" : compact ? "text-sm" : "text-base",
        )}
      >
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn("tabular-nums", compact ? "text-sm" : "font-medium")}
          >
            {e.allDay ? "All day" : timeLabel(e.time)}
          </span>
          {!compact && <Badge variant="outline">{e.category}</Badge>}
          {e.calendarIds.length > 1 && (
            <span className="text-sm text-muted-foreground">Shared</span>
          )}
        </span>
        <span
          className={cn(
            "leading-snug",
            e.featured && "font-bold",
            e.cancelled && "line-through",
          )}
        >
          {e.title}
          {e.host ? ` w/${e.host}` : ""}
          {compact && location ? ` – ${location.code}` : ""}
        </span>
        {!compact && location && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            {location.name}
          </span>
        )}
        {(e.notes || e.detail) && (
          <span className="text-sm italic leading-relaxed">
            {[e.notes, e.detail].filter(Boolean).join(" · ")}
          </span>
        )}
        {calendarId === "all" && (
          <span className="text-sm text-muted-foreground">
            {e.calendarIds
              .map((id) => doc.calendars.find((c) => c.id === id)?.subtitle)
              .filter(Boolean)
              .join(" / ")}
          </span>
        )}
      </button>
    );
  }
  const dayNotes = (date: string) =>
    notes
      .filter((n) => n.date === date)
      .map((n) => (
        <p
          key={n.id}
          className={cn(
            "text-sm leading-relaxed",
            n.banner
              ? "rounded-lg bg-primary/10 p-3 font-bold text-primary"
              : "italic text-muted-foreground",
          )}
        >
          {n.text}
        </p>
      ));
  return (
    <>
      <div
        className="flex flex-col gap-4 lg:hidden"
        aria-label="Monthly agenda"
      >
        {days.map((date) => {
          const values = dayEvents(date);
          return (
            <section
              key={date}
              id={`day-${date}`}
              className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground"
            >
              <header className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                <h3 className="font-semibold">
                  {new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </h3>
                {onDay && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-11 min-w-11"
                    aria-label={`Add event on ${date}`}
                    onClick={() => onDay(date)}
                  >
                    <Plus />
                  </Button>
                )}
              </header>
              <div className="flex flex-col gap-1 p-2">
                {values.map((e) => eventButton(e))}
                {!values.length && (
                  <p className="p-3 text-sm text-muted-foreground">
                    No scheduled activities.
                  </p>
                )}
                {dayNotes(date).length > 0 && (
                  <div className="flex flex-col gap-2 px-3 pb-3">
                    {dayNotes(date)}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <div
        className="hidden overflow-hidden rounded-xl border border-border bg-card text-card-foreground lg:block"
        aria-label="Monthly calendar grid"
      >
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {[
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].map((d) => (
            <div
              key={d}
              className="px-2 py-3 text-center text-sm font-semibold"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from(
            { length: Math.ceil((days.length + offset) / 7) * 7 },
            (_, i) => {
              const date = days[i - offset];
              if (!date)
                return (
                  <div
                    key={i}
                    className="min-h-36 border-b border-r border-border bg-muted/30"
                  />
                );
              return (
                <section
                  key={date}
                  className="flex min-h-40 min-w-0 flex-col border-b border-r border-border p-1.5"
                  onDragOver={(ev) => onMove && ev.preventDefault()}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    const event = events.find(
                      (e) => e.id === ev.dataTransfer.getData("text/plain"),
                    );
                    if (event && onMove) onMove(event, date);
                  }}
                >
                  <header className="flex items-center justify-between px-1">
                    <h3 className="text-base font-semibold tabular-nums">
                      {Number(date.slice(8))}
                      <span className="sr-only"> {month}</span>
                    </h3>
                    {onDay && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Add event on ${date}`}
                        onClick={() => onDay(date)}
                      >
                        <Plus />
                      </Button>
                    )}
                  </header>
                  <div className="flex flex-1 flex-col gap-1">
                    {dayEvents(date).map((e) => eventButton(e, true))}
                  </div>
                  <div className="flex flex-col gap-1 p-1">
                    {dayNotes(date)}
                  </div>
                </section>
              );
            },
          )}
        </div>
      </div>
    </>
  );
}

export function EventDetails({
  event,
  document: doc,
  onClose,
}: {
  event: CalendarEvent | null;
  document: CalendarDocument;
  onClose: () => void;
}) {
  const location = doc.locations.find((l) => l.id === event?.locationId);
  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
        <DialogHeader>
          <DialogTitle>{event?.title}</DialogTitle>
          <DialogDescription>
            {event?.date} · {event?.category}
          </DialogDescription>
        </DialogHeader>
        {event && (
          <div className="flex flex-col gap-4 text-base leading-relaxed">
            <p className="flex items-center gap-2">
              <Clock className="size-5" />
              {event.allDay
                ? "All day"
                : `${timeLabel(event.time)}${event.endTime ? ` – ${timeLabel(event.endTime)}` : ""}`}
            </p>
            {location && (
              <p className="flex items-center gap-2">
                <MapPin className="size-5" />
                {location.name} ({location.code})
              </p>
            )}
            {event.host && <p>Led by {event.host}</p>}
            {event.notes && <p className="italic">{event.notes}</p>}
            {event.detail && <p>{event.detail}</p>}
            {event.signUp && (
              <p className="flex items-center gap-2 font-semibold">
                <Users className="size-5" />
                Sign-up required
                {event.contact ? ` — contact ${event.contact}` : ""}
              </p>
            )}
            {event.cancelled && <Badge variant="secondary">Cancelled</Badge>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
