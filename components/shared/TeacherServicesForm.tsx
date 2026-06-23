'use client';

import { useState } from 'react';
import { addOrUpdateTeacherService } from '@/lib/actions/teacher';
import { teacherServiceSchema } from '@/lib/validations/teacher';
import { Plus, Briefcase, DollarSign, Clock, AlertCircle, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ServiceType = {
  id: string;
  name: string;
  defaultDuration: number;
};

type ConfiguredService = {
  id: string;
  price: number;
  duration: number;
  customDescription: string | null;
  serviceType: {
    name: string;
  };
};

type TeacherServicesFormProps = {
  serviceTypes: ServiceType[];
  configuredServices: ConfiguredService[];
};

export default function TeacherServicesForm({ serviceTypes, configuredServices }: TeacherServicesFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    selectedServiceTypeId: '',
    price: '50',
    duration: '60',
    customDescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Sync service changes to auto-fill default values
  const handleServiceTypeChange = (id: string) => {
    const selected = serviceTypes.find((st) => st.id === id);
    setFormData((prev) => ({
      ...prev,
      selectedServiceTypeId: id,
      duration: selected ? String(selected.defaultDuration) : prev.duration,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const data = {
      serviceTypeId: formData.selectedServiceTypeId,
      price: Number(formData.price),
      duration: Number(formData.duration),
      customDescription: formData.customDescription || undefined,
    };

    try {
      const validated = teacherServiceSchema.safeParse(data);
      if (!validated.success) {
        setErrorMsg(validated.error.issues[0].message);
        return;
      }

      const res = await addOrUpdateTeacherService(data);
      if (res.success) {
        setSuccessMsg('تم حفظ وتحديث الخدمة بنجاح ✓');
        setFormData({
          selectedServiceTypeId: '',
          price: '50',
          duration: '60',
          customDescription: '',
        });
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('حدث خطأ غير متوقع أثناء حفظ وتحديث الخدمة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-8 space-y-8 shadow-sm hover:shadow-md transition-all">
      <div>
        <h2 className="font-extrabold text-xl mb-1">إدارة الخدمات والأسعار</h2>
        <p className="text-xs text-muted-foreground">
          اختر نوع الحصة، حدد مدتها بالدقائق وسعرها بالشيكل ليتمكن الأهالي من حجزها.
        </p>
      </div>

      {/* Grid: Configured List vs Addition Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Addition form */}
        <form onSubmit={handleSubmit} className="lg:col-span-1 bg-slate-50 dark:bg-slate-800/50 border border-border/50 rounded-3xl p-6 space-y-4 shadow-inner">
          <h3 className="font-bold text-sm border-b border-border pb-2.5 flex items-center gap-1.5 text-primary">
            <Plus className="h-4.5 w-4.5" />
            إضافة / تحديث خدمة
          </h3>

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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">نوع الخدمة *</label>
            <select
              value={formData.selectedServiceTypeId}
              onChange={(e) => handleServiceTypeChange(e.target.value)}
              className="w-full premium-input text-xs"
              required
            >
              <option value="">-- اختر نوع الخدمة --</option>
              {serviceTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">رسوم الخدمة (شيكل) *</label>
            <input
              type="number"
              name="price"
              required
              min={5}
              value={formData.price}
              onChange={handleChange}
              className="w-full premium-input text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">المدة المقررة (بالدقائق) *</label>
            <input
              type="number"
              name="duration"
              required
              min={5}
              value={formData.duration}
              onChange={handleChange}
              className="w-full premium-input text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">تفاصيل إضافية (اختياري)</label>
            <textarea
              name="customDescription"
              rows={2}
              value={formData.customDescription}
              onChange={handleChange}
              placeholder="وصف إضافي للمواد أو المناهج المشمولة في هذه الخدمة..."
              className="w-full text-xs premium-input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                حفظ الخدمة
              </>
            )}
          </button>
        </form>

        {/* Configured List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Briefcase className="h-4.5 w-4.5 text-muted-foreground" />
            الخدمات المفعلة في حسابك حالياً ({configuredServices.length})
          </h3>

          {configuredServices.length === 0 ? (
            <div className="border border-border/50 border-dashed rounded-3xl p-10 text-center text-sm font-semibold text-muted-foreground bg-slate-50 dark:bg-slate-800/50">
              لا توجد خدمات مضافة حالياً. يرجى استخدام النموذج لإضافة خدمتك الأولى ليتمكن الأهالي من حجز حصصك.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {configuredServices.map((cs) => (
                <div key={cs.id} className="border border-border/60 rounded-3xl p-5 hover:shadow-md bg-white dark:bg-slate-900 relative space-y-3 transition-all">
                  <div className="font-bold text-sm text-foreground/80">{cs.serviceType.name}</div>
                  
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {cs.duration} دقيقة
                    </span>
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <DollarSign className="h-3.5 w-3.5" />
                      {cs.price} شيكل
                    </span>
                  </div>

                  {cs.customDescription && (
                    <p className="text-[11px] text-muted-foreground bg-accent/40 px-2 py-1 rounded-md">
                      {cs.customDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
