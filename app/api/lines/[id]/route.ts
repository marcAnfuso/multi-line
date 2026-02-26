import { NextRequest, NextResponse } from 'next/server';
import { updateLine, deleteLine, resetClicks } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { name, phone, message, active } = await request.json();

    const line = await updateLine(Number(id), name || '', phone, message, active);
    if (!line) {
      return NextResponse.json({ error: 'Line not found' }, { status: 404 });
    }

    return NextResponse.json(line);
  } catch (error) {
    console.error('[Lines API] Error updating line:', error);
    return NextResponse.json({ error: 'Failed to update line' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteLine(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Lines API] Error deleting line:', error);
    return NextResponse.json({ error: 'Failed to delete line' }, { status: 500 });
  }
}

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await resetClicks(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Lines API] Error resetting clicks:', error);
    return NextResponse.json({ error: 'Failed to reset clicks' }, { status: 500 });
  }
}
