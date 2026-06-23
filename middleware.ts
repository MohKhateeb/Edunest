import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * ملف الوسيط الأمني (Middleware)
 * 
 * المُلخص: هذا الملف هو خط الدفاع الأول للنظام. يعترض جميع الطلبات المتجهة إلى لوحات التحكم (Dashboard)
 * ويتحقق من صلاحيات المستخدم قبل أن يصل الطلب إلى الخادم الفعلي.
 * 
 * لماذا؟: لتطبيق الحماية في طبقة الـ Edge (أسرع وأكثر أماناً)، ولتوجيه كل مستخدم (أدمن، معلم، ولي أمر)
 * إلى مساره الصحيح ومنعه من الدخول لمسارات غير مخصصة له. هذا يمنع ثغرات تخطي الصلاحيات (Role Bypass).
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    // Normalize path: lowercase and remove duplicate slashes
    const path = req.nextUrl.pathname.replace(/\/+/g, '/').toLowerCase();

    // Map base paths to required roles
    const rolePaths: Record<string, string> = {
      '/dashboard/admin': 'ADMIN',
      '/dashboard/teacher': 'TEACHER',
      '/dashboard/parent': 'PARENT',
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
    const sharedPaths = ['/dashboard/session', '/dashboard/profile', '/dashboard/disputes'];
    for (const sharedPath of sharedPaths) {
      if (path.startsWith(sharedPath)) {
        isDashboardPath = true;
        break;
      }
    }

    // Default deny: if it's a dashboard path but doesn't match any of the above
    // (e.g. /dashboard/settings directly), redirect to unauthorized if they don't have a specific dashboard,
    // or redirect to their respective dashboard based on their role.
    if (path === '/dashboard' || (path.startsWith('/dashboard/') && !isDashboardPath)) {
      if (token?.userType === 'ADMIN') return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      if (token?.userType === 'TEACHER') return NextResponse.redirect(new URL("/dashboard/teacher", req.url));
      if (token?.userType === 'PARENT') return NextResponse.redirect(new URL("/dashboard/parent", req.url));
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // السماح بالمرور فقط لمن لديه توكن (مسجل دخول)
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
