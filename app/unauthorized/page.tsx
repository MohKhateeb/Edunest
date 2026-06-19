import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border rounded-2xl p-8 glass shadow-md">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">غير مصرح لك بالدخول</h1>
        <p className="text-sm text-muted-foreground">
          ليست لديك صلاحية للوصول إلى هذا القسم من التطبيق. يرجى التأكد من الحساب المسجل به.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
