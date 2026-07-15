import { Pool } from "pg";

const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  // Don't throw at import time during build; throw on first query instead.
  console.warn(
    "[db] No POSTGRES_URL or DATABASE_URL set. Database queries will fail until configured."
  );
}

// Reuse the pool across hot reloads / serverless invocations.
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

const needsSsl =
  !!connectionString &&
  !/localhost|127\.0\.0\.1/.test(connectionString);

export const pool: Pool =
  globalForPg._pgPool ??
  new Pool({
    connectionString,
    // Verify the server certificate (prevents man-in-the-middle attacks).
    // Managed providers like Neon/Vercel Postgres use publicly trusted certs.
    ssl: needsSsl ? { rejectUnauthorized: true } : undefined,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg._pgPool = pool;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
