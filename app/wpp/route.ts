import { NextResponse } from 'next/server';
import { getActiveLines, incrementClicks } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lines = await getActiveLines();

    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'No hay lineas activas configuradas' },
        { status: 503 }
      );
    }

    const line = lines[Math.floor(Math.random() * lines.length)];

    // Increment click counter (fire and forget, don't block redirect)
    incrementClicks(line.id).catch(() => {});

    const encodedMessage = encodeURIComponent(line.message);
    const whatsappUrl = `https://wa.me/${line.phone}${line.message ? `?text=${encodedMessage}` : ''}`;

    return NextResponse.redirect(whatsappUrl, 302);
  } catch (error) {
    console.error('[WPP Redirect] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
