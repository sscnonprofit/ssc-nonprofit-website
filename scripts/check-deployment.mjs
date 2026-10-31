import { is } from "drizzle-orm"
import { getTableConfig, PgTable } from "drizzle-orm/pg-core"
import { Pool } from "pg"
import { pathToFileURL } from "node:url"

import * as schema from "../lib/db/schema.ts"

export const requiredTables = Object.values(schema)
  .filter((value) => is(value, PgTable))
  .map((table) => {
    const config = getTableConfig(table)
    return {
      name: config.name,
      schema: config.schema ?? "public",
      columns: config.columns.map((column) => column.name),
    }
  })

export function getDatabaseUrl(env = process.env) {
  return env.SSC_DATABASE_URL?.trim() || env.DATABASE_URL?.trim() || ""
}

export function checkEnvironment(env) {
  const problems = []
  const databaseUrl = getDatabaseUrl(env)
  const secret = env.BETTER_AUTH_SECRET?.trim()
  if (!secret || secret.length < 32) {
    problems.push("Set BETTER_AUTH_SECRET to a private, randomly generated value of at least 32 characters in this Vercel project's Environment Variables. Do not use a default or placeholder secret.")
  }

  try {
    const url = new URL(databaseUrl)
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
      throw new Error("Invalid PostgreSQL URL")
    }
  } catch {
    problems.push("Set DATABASE_URL to the PostgreSQL connection string for the initialized website database. A new Vercel or GitHub account does not inherit the old project's database connection.")
  }
  return problems
}

export function checkSchema(rows, tables = requiredTables) {
  const problems = []
  const columnsByTable = new Map()
  for (const row of rows) {
    const key = `${row.table_schema}.${row.table_name}`
    if (!columnsByTable.has(key)) columnsByTable.set(key, new Set())
    columnsByTable.get(key).add(row.column_name)
  }

  for (const table of tables) {
    const key = `${table.schema}.${table.name}`
    const columns = columnsByTable.get(key)
    if (!columns) {
      problems.push(`Missing database table: ${key}`)
      continue
    }
    const missing = table.columns.filter((column) => !columns.has(column))
    if (missing.length) problems.push(`Missing database columns in ${key}: ${missing.join(", ")}`)
  }
  return problems
}

export async function inspectDatabase(pool) {
  // Read schema metadata only: never read accounts, passwords, sessions, or site records.
  const { rows } = await pool.query(
    `SELECT table_schema, table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = ANY($1::text[]) AND table_name = ANY($2::text[])`,
    [Array.from(new Set(requiredTables.map((table) => table.schema))), requiredTables.map((table) => table.name)],
  )
  return checkSchema(rows)
}

async function main() {
  let problems = checkEnvironment(process.env)
  if (!problems.length) {
    const pool = new Pool({
      connectionString: getDatabaseUrl(),
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
    })
    try {
      problems = await inspectDatabase(pool)
      if (problems.length) {
        problems.push("Connect DATABASE_URL to the existing initialized website database, or migrate its complete schema and data into the new database. GitHub contains application code, not database tables or records. No database changes were made by this check.")
      }
    } catch {
      problems.push("Cannot inspect the configured database. Verify DATABASE_URL, database availability, network access, and schema permissions in the destination Vercel project. Connection details have not been logged.")
    } finally {
      await pool.end()
    }
  }

  if (problems.length) {
    console.error("\nDeployment setup is incomplete:\n")
    for (const problem of problems) console.error(`- ${problem}`)
    console.error("\nUpdate Settings > Environment Variables in the destination Vercel project for the deployment's environment, then redeploy.\n")
    process.exitCode = 1
    return
  }
  console.log(`Deployment configuration and ${requiredTables.length} database table definitions verified.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error("Deployment readiness check could not finish. Verify the destination project's environment and database configuration.")
    process.exitCode = 1
  })
}
