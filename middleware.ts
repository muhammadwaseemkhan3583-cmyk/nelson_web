import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to decode Firebase JWT in Edge Runtime
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. If no token and trying to access dashboard, redirect to login
  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If token exists and trying to access login, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/')) {
    const payload = parseJwt(token);
    const role = payload?.role;
    
    if (role === 'Admin') return NextResponse.redirect(new URL('/dashboard/admin_dashboard', request.url));
    if (role === 'Finance') return NextResponse.redirect(new URL('/dashboard/fin_dashboard', request.url));
    if (role === 'Security') return NextResponse.redirect(new URL('/dashboard/security_dashboard', request.url));
    if (role === 'Operation') return NextResponse.redirect(new URL('/dashboard/operation_dashboard', request.url));
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Role-Based Access Control (RBAC)
  if (token && pathname.startsWith('/dashboard')) {
    const payload = parseJwt(token);
    const role = payload?.role;

    // Check expiration (exp is in seconds)
    if (payload?.exp && Date.now() >= payload.exp * 1000) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
    }

    // Protect Admin Dashboard
    if (pathname.includes('/admin_dashboard') && role !== 'Admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protect Finance Dashboard
    if (pathname.includes('/fin_dashboard') && role !== 'Finance' && role !== 'Admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protect Security Dashboard
    if (pathname.includes('/security_dashboard') && role !== 'Security' && role !== 'Admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protect Operation Dashboard
    if (pathname.includes('/operation_dashboard') && role !== 'Operation' && role !== 'Admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/'],
};
