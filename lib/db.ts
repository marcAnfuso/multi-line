import { neon } from '@neondatabase/serverless';

export interface Line {
  id: number;
  phone: string;
  message: string;
  active: boolean;
  created_at: string;
}

function getSQL() {
  return neon(process.env.DATABASE_URL!);
}

export async function getLines(): Promise<Line[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM lines ORDER BY created_at DESC`;
  return rows as Line[];
}

export async function getActiveLines(): Promise<Line[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM lines WHERE active = true`;
  return rows as Line[];
}

export async function createLine(phone: string, message: string): Promise<Line> {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO lines (phone, message) VALUES (${phone}, ${message}) RETURNING *
  `;
  return rows[0] as Line;
}

export async function updateLine(id: number, phone: string, message: string, active: boolean): Promise<Line | null> {
  const sql = getSQL();
  const rows = await sql`
    UPDATE lines SET phone = ${phone}, message = ${message}, active = ${active}
    WHERE id = ${id} RETURNING *
  `;
  return (rows[0] as Line) || null;
}

export async function deleteLine(id: number): Promise<boolean> {
  const sql = getSQL();
  const rows = await sql`DELETE FROM lines WHERE id = ${id}`;
  return rows.length >= 0;
}

export async function initDatabase(): Promise<void> {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS lines (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
}
