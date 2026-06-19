'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { loginSchema } from '@/lib/validations/user';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // Validate inputs client-side
      const validated = loginSchema.safeParse(formData);
      if (!validated.success) {
        setErrorMsg(validated.error.issues[0].message);
        setLoading(false);
        return;
      }

      const res = await signIn('credentials', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === 'BANNED_USER' || res.error.includes('BANNED_USER')) {
          setErrorMsg('عذراً، تم إيقاف نشاط هذا الحساب. يرجى التواصل مع إدارة المنصة للاستفسار والدعم.');
        } else {
          setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
        setLoading(false);
      } else {
        // Fetch session info to redirect correctly
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        const userType = session?.user?.userType;

        if (userType === 'ADMIN') {
          router.push('/dashboard/admin');
        } else if (userType === 'TEACHER') {
          router.push('/dashboard/teacher');
        } else {
          router.push('/dashboard/parent');
        }
        router.refresh();
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('حدث خطأ غير متوقع أثناء تسجيل الدخول');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-teal-50 via-background to-teal-50/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-extrabold text-primary tracking-tight">
            <GraduationCap className="h-10 w-10 text-primary" />
            <span>إيدونِست</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground/90">أهلاً بك مجدداً</h2>
          <p className="text-xs text-muted-foreground">قم بتسجيل الدخول إلى حسابك للمتابعة</p>
        </div>

        {/* Card Form */}
        <div className="bg-card border border-border rounded-2xl p-8 glass shadow-lg glow-effect">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full premium-input text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                كلمة المرور
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full premium-input text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-muted-foreground">
          ليس لديك حساب؟{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            أنشئ حساباً جديداً الآن
          </Link>
        </p>
      </div>
    </div>
  );
}
