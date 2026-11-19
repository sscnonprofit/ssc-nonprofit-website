// Repairs columns whose database defaults drifted from lib/db/schema.ts: id
// columns declared `serial` that have no auto-increment, plus missing
// .default()/.defaultNow() values. Without them inserts fail with "null value
// in column ...", which broke calendar saves (calendar_history) and page
// builder saves/publishes (pages, page_revisions).
//
// Idempotent and transactional. Run: node --env-file=.env.local scripts/fix-serial-ids.mjs
import pg from "pg"

const TABLES = ["calendar_history", "pages", "page_revisions"]

// Column defaults schema.ts declares (.default / .defaultNow) that the database
// is missing. calendar_history.created_at is NOT NULL, so it also broke saves.
const DEFAULTS = [
  ["calendar_history", "created_at", "now()"],
  ["calendar_workspaces", "updated_at", "now()"],
  ["calendar_workspaces", "version", "1"],
  ["pages", "status", "'published'"],
  ["pages", "created_at", "now()"],
  ["pages", "updated_at", "now()"],
  ["page_revisions", "created_at", "now()"],
]

const connectionString = process.env.SSC_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL
if (!connectionString) throw new Error("A PostgreSQL connection string is required")

const client = new pg.Client({ connectionString })
await client.connect()
try {
  await client.query("begin")
  for (const table of TABLES) {
    const { rows } = await client.query(
      "select data_type, column_default from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = 'id'",
      [table],
    )
    if (!rows.length) {
      console.log(`${table}: no id column, skipped`)
      continue
    }
    const [{ data_type: type, column_default: current }] = rows
    if (type !== "integer") {
      await client.query(`alter table "${table}" alter column id type integer using id::integer`)
      console.log(`${table}: id converted from ${type} to integer`)
    }
    if (!current?.startsWith("nextval(")) {
      const seq = `${table}_id_seq`
      await client.query(`create sequence if not exists "${seq}" owned by "${table}".id`)
      await client.query(`select setval('"${seq}"', coalesce((select max(id) from "${table}"), 0) + 1, false)`)
      await client.query(`alter table "${table}" alter column id set default nextval('"${seq}"')`)
      console.log(`${table}: id now defaults to ${seq}`)
    } else {
      console.log(`${table}: already has a default`)
    }
  }
  for (const [table, column, value] of DEFAULTS) {
    const { rows } = await client.query(
      "select column_default from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = $2",
      [table, column],
    )
    if (!rows.length || rows[0].column_default != null) continue
    await client.query(`alter table "${table}" alter column "${column}" set default ${value}`)
    console.log(`${table}.${column}: default set to ${value}`)
  }
  await client.query("commit")
} catch (error) {
  await client.query("rollback")
  throw error
} finally {
  await client.end()
}
