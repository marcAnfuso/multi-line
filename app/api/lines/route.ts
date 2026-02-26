import { NextRequest, NextResponse } from 'next/server';
import { getLinesByGroup, createLine } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const groupId = request.nextUrl.searchParams.get('group_id');
    if (!groupId) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }
    const lines = await getLinesByGroup(Number(groupId));
    return NextResponse.json(lines);
  } catch (error) {
    console.error('[Lines API] Error fetching lines:', error);
    return NextResponse.json({ error: 'Failed to fetch lines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { group_id, name, phone, message } = await request.json();

    if (!phone || !group_id) {
      return NextResponse.json({ error: 'Phone and group_id are required' }, { status: 400 });
    }

    const line = await createLine(group_id, name || '', phone, message || '');
    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    console.error('[Lines API] Error creating line:', error);
    return NextResponse.json({ error: 'Failed to create line' }, { status: 500 });
  }
}
