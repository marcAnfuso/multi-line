import { neon } from '@neondatabase/serverless';

export interface Line {
  id: number;
  name: string;
  phone: string;
  message: string;
  active: boolean;
  clicks: number;
  created_at: string;
}

function getSQL() {
  return neon(process.env.DATABASE_URL!);
}

// Auto-migration: runs once per cold start, adds new columns if missing
let migrated = false;
async function ensureSchema() {
  if (migrated) return;
  const sql = getSQL();
  await sql`ALTER TABLE lines ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE lines ADD COLUMN IF NOT EXISTS clicks INTEGER NOT NULL DEFAULT 0`;
  migrated = true;
}

export async function getLines(): Promise<Line[]> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM lines ORDER BY created_at DESC`;
  return rows as Line[];
}

export async function getActiveLines(): Promise<Line[]> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM lines WHERE active = true`;
  return rows as Line[];
}

export async function createLine(name: string, phone: string, message: string): Promise<Line> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO lines (name, phone, message) VALUES (${name}, ${phone}, ${message}) RETURNING *
  `;
  return rows[0] as Line;
}

export async function updateLine(id: number, name: string, phone: string, message: string, active: boolean): Promise<Line | null> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`
    UPDATE lines SET name = ${name}, phone = ${phone}, message = ${message}, active = ${active}
    WHERE id = ${id} RETURNING *
  `;
  return (rows[0] as Line) || null;
}

export async function incrementClicks(id: number): Promise<void> {
  const sql = getSQL();
  await sql`UPDATE lines SET clicks = clicks + 1 WHERE id = ${id}`;
}

export async function deleteLine(id: number): Promise<boolean> {
  const sql = getSQL();
  const rows = await sql`DELETE FROM lines WHERE id = ${id}`;
  return rows.length >= 0;
}

export async function resetClicks(id: number): Promise<void> {
  const sql = getSQL();
  await sql`UPDATE lines SET clicks = 0 WHERE id = ${id}`;
}

export async function initDatabase(): Promise<void> {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS lines (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL DEFAULT '',
      phone VARCHAR(20) NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT true,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await ensureSchema();
}
