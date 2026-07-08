import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// We can't import the jose decrypt directly here because middleware is edge-based and our session uses standard JWT logic,
// but actually, jose *does* support Edge runtime. We can import decrypt from session.ts.
import { decrypt } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  
  let isAuthenticated = false;
  let isSuperAdmin = false;

  if (sessionCookie) {
    const payload = await decrypt(sessionCookie);
    if (payload) {
      isAuthenticated = true;
      if (typeof payload.role === 'string' && (payload.role.toLowerCase() === 'owner' || payload.role.toLowerCase() === 'admin')) {
        isSuperAdmin = true;
      }
    }
  }

  const isLoginPage = request.nextUrl.pathname === '/login';

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isLoginPage && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isUsersPage = request.nextUrl.pathname.startsWith('/users');
  const isDatabasePage = request.nextUrl.pathname.startsWith('/database');
  
  if ((isUsersPage || isDatabasePage) && !isSuperAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
