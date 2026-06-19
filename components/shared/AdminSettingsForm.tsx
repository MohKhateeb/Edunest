'use client';

import { useState } from 'react';
import { updateSystemSettings } from '@/lib/actions/admin';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SystemSetting = {
  id: string;
  settingKey: string;
  settingValue: string;
  description: string | null;
};

type AdminSettingsFormProps = {
  initialSettings: SystemSetting[];
};

export default function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleValueChange = (key: string, value: string) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    const updated = settings.map((s) => (s.settingKey === key ? { ...s, settingValue: value } : s));
    setSettings(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = settings.map((s) => ({
      settingKey: s.settingKey,
      settingValue: s.settingValue,
    }));

    const res = await updateSystemSettings(payload);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('تم حفظ وتحديث إعدادات النظام بنجاح ✓');
      router.refresh();
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 space-y-6 shadow-sm">
      <div>
        <h2 className="font-extrabold text-xl mb-1">إعدادات النظام الديناميكية</h2>
        <p className="text-xs text-muted-foreground">
          تحكم في نسب العمولات، سياسات الإلغاء، الجلسات المجانية والأسعار الدنيا في المنصة.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Grid inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-y border-border py-6">
        {settings.map((s) => (
          <div key={s.settingKey} className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/80 block">{s.settingKey}</label>
            <input
              type="text"
              required
              value={s.settingValue}
              onChange={(e) => handleValueChange(s.settingKey, e.target.value)}
              className="w-full premium-input text-xs"
            />
            {s.description && (
              <span className="text-[10px] text-muted-foreground block leading-relaxed">
                {s.description}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              جاري حفظ الإعدادات...
            </>
          ) : (
            <>
              <Save className="h-4.5 w-4.5" />
              حفظ وتطبيق الإعدادات
            </>
          )}
        </button>
      </div>
    </form>
  );
}
