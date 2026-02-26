import { NextRequest, NextResponse } from 'next/server';
import { getLines, createLine } from '@/lib/db';

export async function GET() {
  try {
    const lines = await getLines();
    return NextResponse.json(lines);
  } catch (error) {
    console.error('[Lines API] Error fetching lines:', error);
    return NextResponse.json({ error: 'Failed to fetch lines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, message } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const line = await createLine(name || '', phone, message || '');
    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    console.error('[Lines API] Error creating line:', error);
    return NextResponse.json({ error: 'Failed to create line' }, { status: 500 });
  }
}
