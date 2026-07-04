import { NextResponse, NextRequest, NextFetchEvent } from "next/server";
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { FEATURE_FLAGS } from '@/lib/config/feature-flags';

const intlMiddleware = createMiddleware(routing);

const authProxy = withAuth(
	function proxy(req) {
		const token = req.nextauth.token;
		// Normalize path: lowercase and remove duplicate slashes
		let path = req.nextUrl.pathname.replace(/\/+/g, "/").toLowerCase();
		
		// Strip locale prefix if present to not break auth logic
		if (path.startsWith('/en/') || path === '/en') {
			path = path.replace(/^\/en/, '') || '/';
		} else if (path.startsWith('/ar/') || path === '/ar') {
			path = path.replace(/^\/ar/, '') || '/';
		}

		// Map base paths to required roles
		const rolePaths: Record<string, string> = {
			"/dashboard/admin": "ADMIN",
			"/dashboard/teacher": "TEACHER",
			"/dashboard/parent": "PARENT",
		};

		let isDashboardPath = false;

		for (const [basePath, requiredRole] of Object.entries(rolePaths)) {
			if (path.startsWith(basePath)) {
				isDashboardPath = true;
				if (token?.userType !== requiredRole) {
					return NextResponse.redirect(new URL("/unauthorized", req.url));
				}
				break; // Only one base path matches the start
			}
		}

		// السماح بالمسارات المشتركة بين كل المستخدمين (مثل الجلسات، الملف الشخصي، النزاعات)
		const sharedPaths = [
			"/dashboard/session",
			"/dashboard/profile",
			"/dashboard/disputes",
		];
		for (const sharedPath of sharedPaths) {
			if (path.startsWith(sharedPath)) {
				isDashboardPath = true;
				break;
			}
		}

		// Default deny: if it's a dashboard path but doesn't match any of the above
		// (e.g. /dashboard/settings directly), redirect to unauthorized if they don't have a specific dashboard,
		// or redirect to their respective dashboard based on their role.
		if (
			path === "/dashboard" ||
			(path.startsWith("/dashboard/") && !isDashboardPath)
		) {
			if (token?.userType === "ADMIN")
				return NextResponse.redirect(new URL("/dashboard/admin", req.url));
			if (token?.userType === "TEACHER")
				return NextResponse.redirect(new URL("/dashboard/teacher", req.url));
			if (token?.userType === "PARENT")
				return NextResponse.redirect(new URL("/dashboard/parent", req.url));
			return NextResponse.redirect(new URL("/unauthorized", req.url));
		}

		if (FEATURE_FLAGS.I18N_ENABLED) {
			return intlMiddleware(req);
		}
		return NextResponse.next();
	},
	{
		callbacks: {
			// السماح بالمرور فقط لمن لديه توكن (مسجل دخول)
			authorized: ({ token }) => !!token,
		},
	},
);

export default function proxy(req: NextRequestWithAuth, event: NextFetchEvent) {
	if (!FEATURE_FLAGS.I18N_ENABLED) {
		// If i18n is disabled, we must act exactly like original proxy.ts
		// which only ran on /dashboard/*
		const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');
		if (isDashboard) {
			return authProxy(req, event);
		}
		return NextResponse.next();
	}

	const path = req.nextUrl.pathname;
	const isDashboard = path.startsWith('/dashboard') || path.startsWith('/en/dashboard') || path.startsWith('/ar/dashboard');
	
	if (isDashboard) {
		return authProxy(req, event);
	}
	
	return intlMiddleware(req);
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
