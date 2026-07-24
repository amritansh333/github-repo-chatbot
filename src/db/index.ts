import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (process.env.NODE_ENV === "production") {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
  }
  // In development, reuse the pool across HMR reloads
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
  }
  return global._pgPool;
}

export const db = drizzle(getPool(), { schema });
export type DB = typeof db;
