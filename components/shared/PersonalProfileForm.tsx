'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { updateUserProfile, changeUserPassword } from '@/lib/actions/user';
import { User, Lock, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type PersonalProfileFormProps = {
  initialUser: {
    name: string;
    email: string;
    phone: string | null;
  };
};

export default function PersonalProfileForm({ initialUser }: PersonalProfileFormProps) {
  const { update } = useSession();
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile fields state
  const [profileForm, setProfileForm] = useState({
    name: initialUser.name,
    email: initialUser.email,
    phone: initialUser.phone || '',
  });

  // Password fields state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateUserProfile(profileForm);
      if (res.success) {
        setSuccessMsg('تم تحديث بيانات الحساب بنجاح ✓');
        toast.success('تم تحديث الملف الشخصي');
        // Update next-auth session to reflect the new name/email
        await update({
          name: profileForm.name,
          email: profileForm.email,
        });
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg('حدث خطأ غير متوقع أثناء تحديث البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMsg('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await changeUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      if (res.success) {
        setSuccessMsg('تم تغيير كلمة المرور بنجاح ✓');
        toast.success('تم تحديث كلمة المرور');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg('حدث خطأ غير متوقع أثناء تغيير كلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl overflow-hidden shadow-sm">
      {/* Tab Switchers */}
      <div className="flex border-b border-border/60 bg-slate-50/50 dark:bg-slate-800/10">
        <button
          onClick={() => {
            setActiveTab('info');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-black transition-colors border-b-2 cursor-pointer ${
            activeTab === 'info'
              ? 'border-primary text-primary bg-white dark:bg-slate-900'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="h-4.5 w-4.5" />
          تعديل البيانات الأساسية
        </button>
        <button
          onClick={() => {
            setActiveTab('security');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-black transition-colors border-b-2 cursor-pointer ${
            activeTab === 'security'
              ? 'border-primary text-primary bg-white dark:bg-slate-900'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock className="h-4.5 w-4.5" />
          تغيير كلمة المرور
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Messages Feedback */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-4 rounded-2xl border border-rose-100 dark:border-rose-950/40 animate-in fade-in duration-200">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2.5 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-950/40 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Info Form */}
        {activeTab === 'info' && (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80 block">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full premium-input text-xs px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 border border-border/80 rounded-xl"
                  placeholder="أدخل اسمك بالكامل"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80 block">رقم الهاتف</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full premium-input text-xs px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 border border-border/80 rounded-xl text-left"
                  placeholder="05xxxxxxx"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 block">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full premium-input text-xs px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 border border-border/80 rounded-xl text-left"
                  placeholder="email@example.com"
                  dir="ltr"
                />
                <span className="text-[10px] text-muted-foreground block mt-1">
                  تنبيه: ستقوم باستخدام البريد الإلكتروني الجديد لتسجيل الدخول في المرات القادمة.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground px-6 py-3 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ التغييرات
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security Form */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="space-y-5 max-w-lg">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80 block">كلمة المرور الحالية</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full premium-input text-xs px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 border border-border/80 rounded-xl text-left"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80 block">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full premium-input text-xs px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 border border-border/80 rounded-xl text-left"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80 block">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full premium-input text-xs px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 border border-border/80 rounded-xl text-left"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground px-6 py-3 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                تحديث كلمة المرور
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
