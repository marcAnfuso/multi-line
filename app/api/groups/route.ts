import { NextRequest, NextResponse } from 'next/server';
import { getGroups, createGroup } from '@/lib/db';

export async function GET() {
  try {
    const groups = await getGroups();
    return NextResponse.json(groups);
  } catch (error) {
    console.error('[Groups API] Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Sanitize slug: lowercase, only alphanumeric and underscores
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const group = await createGroup(name, cleanSlug);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('[Groups API] Error creating group:', error);
    const message = error instanceof Error && error.message.includes('unique')
      ? 'Ya existe un canal con ese slug'
      : 'Failed to create group';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
