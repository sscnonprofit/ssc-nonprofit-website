import type { CSSProperties } from "react";
import type { Calendar, CalendarAppearance } from "./model";

export const DEFAULT_APPEARANCE: CalendarAppearance = {
  accentColor: "",
  fontSize: 16,
  density: "comfortable",
  weekStartsOn: 0,
  shadeWeekends: false,
  gridLines: true,
  showLocation: true,
  showEventDetails: true,
  headerAlign: "left",
};

export function calendarAppearance(calendar?: Calendar): CalendarAppearance {
  return { ...DEFAULT_APPEARANCE, ...calendar?.appearance };
}

export function printAccent(calendar: Calendar) {
  return calendarAppearance(calendar).accentColor || (calendar.color === "wine" ? "#7c1231" : "#8c5717");
}

export function contrastText(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722 > 0.179 ? "#262626" : "#ffffff";
}

export function appearanceStyle(calendar?: Calendar): CSSProperties {
  const appearance = calendarAppearance(calendar);
  return {
    "--cal-accent": appearance.accentColor || "var(--primary)",
    "--cal-accent-foreground": appearance.accentColor ? contrastText(appearance.accentColor) : "var(--primary-foreground)",
    "--cal-font-size": `${appearance.fontSize}px`,
    "--cal-event-padding": { compact: "0.25rem", comfortable: "0.375rem", spacious: "0.75rem" }[appearance.density],
    "--cal-event-gap": { compact: "0.125rem", comfortable: "0.25rem", spacious: "0.5rem" }[appearance.density],
  } as CSSProperties;
}

export function calendarWeekdays(start: 0 | 1) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return [...days.slice(start), ...days.slice(0, start)];
}
