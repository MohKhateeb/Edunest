import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const userType = token?.userType as string | undefined;

    if (path.startsWith('/dashboard/parent') && userType !== 'PARENT') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (path.startsWith('/dashboard/teacher') && userType !== 'TEACHER') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (path.startsWith('/dashboard/admin') && userType !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
