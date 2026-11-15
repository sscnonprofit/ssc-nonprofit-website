import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { withVerifiedSsl } from "./connection-string"
import * as schema from "./schema"

const connectionString =
  process.env.SSC_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error("A PostgreSQL connection string is required")
}

export const pool = new Pool({ connectionString: withVerifiedSsl(connectionString) })
export const db = drizzle(pool, { schema })
