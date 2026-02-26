import { NextRequest, NextResponse } from 'next/server';
import { updateGroup, deleteGroup } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { name, slug } = await request.json();

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const group = await updateGroup(Number(id), name, cleanSlug);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('[Groups API] Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteGroup(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Groups API] Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
