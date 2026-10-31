import { and, eq } from "drizzle-orm";
import { db, pool } from "../lib/db";
import { calendarWorkspaces } from "../lib/db/schema";
import { novemberSeed } from "../lib/calendars/seed";

async function main() {
  const document = novemberSeed();
  if (process.argv.includes("--refresh-untouched-import")) {
    const refreshed = await db
      .update(calendarWorkspaces)
      .set({ document })
      .where(
        and(
          eq(calendarWorkspaces.id, "ssc-activity-calendars"),
          eq(calendarWorkspaces.version, 1),
        ),
      )
      .returning({ id: calendarWorkspaces.id });
    if (!refreshed.length)
      throw new Error("Import was edited by staff; refusing to overwrite it.");
    console.log("Refreshed untouched initial source import.");
    await pool.end();
    return;
  }
  const rows = await db
    .insert(calendarWorkspaces)
    .values({
      id: "ssc-activity-calendars",
      userId: "ssc-community",
      document,
      version: 1,
    })
    .onConflictDoNothing()
    .returning({ id: calendarWorkspaces.id });
  console.log(
    rows.length
      ? `Imported ${document.calendars.length} calendars, ${document.series.length} recurring series and ${document.events.length} one-off events.`
      : "Calendar workspace already exists; no data overwritten.",
  );
  await pool.end();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  pool.end();
});
