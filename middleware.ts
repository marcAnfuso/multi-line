import { NextRequest, NextResponse } from 'next/server';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/lines') || pathname.startsWith('/api/init')) {
    const session = request.cookies.get('multilinea_session');
    const password = process.env.ADMIN_PASSWORD || '';
    const expectedToken = await sha256(password);

    if (!session || session.value !== expectedToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/lines/:path*', '/api/init/:path*'],
};
