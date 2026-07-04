import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Try to get the pb_auth cookie
  const authCookie = request.cookies.get('pb_auth');
  
  // Basic validation: the cookie value contains a JWT token if authenticated
  const isAuthenticated = authCookie && authCookie.value && authCookie.value.includes('"token":"');

  const isLoginPage = request.nextUrl.pathname === '/login';
  
  // Static assets and internal next routes shouldn't be blocked (handled by matcher)
  
  if (isLoginPage && isAuthenticated) {
    // If user is already logged in and tries to access login, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isLoginPage && !isAuthenticated) {
    // If user is not logged in and tries to access any other route, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Super Admin RBAC check for User Management
  let isSuperAdmin = false;
  if (isAuthenticated && authCookie?.value) {
    try {
      let parsed;
      try {
        parsed = JSON.parse(authCookie.value);
      } catch (e) {
        parsed = JSON.parse(decodeURIComponent(authCookie.value));
      }
      const userRole = parsed.model?.role || parsed.model?.Role;
      if (typeof userRole === 'string' && userRole.toLowerCase() === 'admin') {
        isSuperAdmin = true;
      }
    } catch(e) {
      // Ignore parsing errors
    }
  }

  const isUsersPage = request.nextUrl.pathname.startsWith('/users');
  const isDatabasePage = request.nextUrl.pathname.startsWith('/database');
  if ((isUsersPage || isDatabasePage) && !isSuperAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
