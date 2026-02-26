import { NextRequest, NextResponse } from 'next/server';
import { getGroupBySlug, getActiveLinesByGroup, incrementClicks } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const group = await getGroupBySlug(slug);
    if (!group) {
      return NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 });
    }

    const lines = await getActiveLinesByGroup(group.id);
    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'No hay líneas activas en este canal' },
        { status: 503 }
      );
    }

    const line = lines[Math.floor(Math.random() * lines.length)];

    // Increment click counter (fire and forget)
    incrementClicks(line.id).catch(() => {});

    const encodedMessage = encodeURIComponent(line.message);
    const whatsappUrl = `https://wa.me/${line.phone}${line.message ? `?text=${encodedMessage}` : ''}`;

    return NextResponse.redirect(whatsappUrl, 302);
  } catch (error) {
    console.error('[WPP Redirect] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
