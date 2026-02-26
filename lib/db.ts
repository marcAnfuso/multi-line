import { neon } from '@neondatabase/serverless';

export interface Group {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface Line {
  id: number;
  group_id: number;
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

// Auto-migration: creates tables if missing, adds new columns if missing
let migrated = false;
async function ensureSchema() {
  if (migrated) return;
  const sql = getSQL();
  console.log('[DB Migration] Running ensureSchema...');

  // Create groups table
  await sql`
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Create lines table
  await sql`
    CREATE TABLE IF NOT EXISTS lines (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL DEFAULT '',
      phone VARCHAR(20) NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT true,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Add columns if missing (for existing tables)
  try {
    await sql`ALTER TABLE lines ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE lines ADD COLUMN IF NOT EXISTS clicks INTEGER NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE lines ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE`;
  } catch (err) {
    console.log('[DB Migration] Column migration note:', err);
  }

  // Migrate orphan lines: create "wpp" group and assign them
  try {
    const orphans = await sql`SELECT id FROM lines WHERE group_id IS NULL LIMIT 1`;
    if (orphans.length > 0) {
      // Ensure "wpp" group exists
      const existing = await sql`SELECT id FROM groups WHERE slug = 'wpp'`;
      let groupId: number;
      if (existing.length > 0) {
        groupId = existing[0].id as number;
      } else {
        const created = await sql`INSERT INTO groups (name, slug) VALUES ('WPP', 'wpp') RETURNING id`;
        groupId = created[0].id as number;
      }
      await sql`UPDATE lines SET group_id = ${groupId} WHERE group_id IS NULL`;
      console.log('[DB Migration] Migrated orphan lines to group wpp');
    }
  } catch (err) {
    console.log('[DB Migration] Orphan migration note:', err);
  }

  migrated = true;
  console.log('[DB Migration] Done');
}

// ---- Groups CRUD ----

export async function getGroups(): Promise<Group[]> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM groups ORDER BY created_at ASC`;
  return rows as Group[];
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM groups WHERE slug = ${slug}`;
  return (rows[0] as Group) || null;
}

export async function createGroup(name: string, slug: string): Promise<Group> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO groups (name, slug) VALUES (${name}, ${slug}) RETURNING *
  `;
  return rows[0] as Group;
}

export async function updateGroup(id: number, name: string, slug: string): Promise<Group | null> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`
    UPDATE groups SET name = ${name}, slug = ${slug} WHERE id = ${id} RETURNING *
  `;
  return (rows[0] as Group) || null;
}

export async function deleteGroup(id: number): Promise<boolean> {
  const sql = getSQL();
  await sql`DELETE FROM groups WHERE id = ${id}`;
  return true;
}

// ---- Lines CRUD ----

export async function getLinesByGroup(groupId: number): Promise<Line[]> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM lines WHERE group_id = ${groupId} ORDER BY created_at DESC`;
  return rows as Line[];
}

export async function getActiveLinesByGroup(groupId: number): Promise<Line[]> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM lines WHERE group_id = ${groupId} AND active = true`;
  return rows as Line[];
}

export async function createLine(groupId: number, name: string, phone: string, message: string): Promise<Line> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO lines (group_id, name, phone, message) VALUES (${groupId}, ${name}, ${phone}, ${message}) RETURNING *
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
  await sql`DELETE FROM lines WHERE id = ${id}`;
  return true;
}

export async function resetClicks(id: number): Promise<void> {
  const sql = getSQL();
  await sql`UPDATE lines SET clicks = 0 WHERE id = ${id}`;
}
