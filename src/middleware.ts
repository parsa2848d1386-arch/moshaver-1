import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes (not auth-related ones)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/cron/')) {
    // Check for authorization - uid must be present
    const uid = request.nextUrl.searchParams.get('uid');
    const hasBody = request.method === 'POST' || request.method === 'PUT';

    // For GET requests, check uid in query params
    if (request.method === 'GET' && !uid && pathname !== '/api/insights') {
      return NextResponse.json(
        { error: 'احراز هویت الزامی است. لطفاً وارد شوید.' },
        { status: 401 }
      );
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
