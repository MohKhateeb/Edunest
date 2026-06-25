'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTutoringRequest } from '@/lib/actions/tutoring-request';
import { User, BookOpen, Clock, CreditCard, UploadCloud, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Student = {
  id: string;
  name: string;
  grade: number;
};

type ServiceType = {
  id: string;
  name: string;
  nameEnglish: string | null;
  defaultDuration: number;
};

type NewGeneralRequestFormProps = {
  students: Student[];
  subjects: { id: string; name: string }[];
  serviceTypes: ServiceType[];
};

export default function NewGeneralRequestForm({
  students,
  subjects,
  serviceTypes,
}: NewGeneralRequestFormProps) {
  const router = useRouter();

  // الحالة الافتراضية للنموذج
  const [formData, setFormData] = useState({
    studentId: students[0]?.id ?? '',
    subjectId: subjects[0]?.id ?? '',
    serviceTypeId: serviceTypes[0]?.id ?? '',
    title: '',
    details: '',
    imageUrl: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // تحديث الحقول العادية
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // تغيير نوع الخدمة وتحديث مدتها الافتراضية تلقائياً
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceTypeId = e.target.value;
    const selectedService = serviceTypes.find((s) => s.id === serviceTypeId);
    setFormData((prev) => ({
      ...prev,
      serviceTypeId,
    }));
  };

  // رفع صورة المسألة للطلب
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg(null);

    const data = new FormData();
    data.append('file', file);
    data.append('bucket', 'verifications'); // نستخدم bucket التوثيق للسهولة ودعم الصور

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const resData = await res.json();
      setUploadingImage(false);

      if (res.ok && resData.url) {
        setFormData((prev) => ({ ...prev, imageUrl: resData.url }));
        toast.success('تم رفع الصورة بنجاح');
      } else {
        setErrorMsg(resData.error || 'فشل رفع صورة المسألة');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء الاتصال بخادم رفع الملفات');
      setUploadingImage(false);
    }
  };

  // إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.studentId) {
      setErrorMsg('يرجى تحديد الطالب');
      return;
    }
    if (!formData.subjectId) {
      setErrorMsg('يرجى تحديد التخصص/المادة');
      return;
    }
    if (!formData.serviceTypeId) {
      setErrorMsg('يرجى تحديد نوع الجلسة');
      return;
    }
    if (formData.title.trim().length < 3) {
      setErrorMsg('عنوان الطلب قصير جداً، يجب ألا يقل عن 3 أحرف');
      return;
    }

    setLoading(true);

    try {
      const res = await createTutoringRequest({
        ...formData,
      });

      setLoading(false);

      if (res.success) {
        setSuccess(true);
        toast.success('تم نشر طلبك العام بنجاح! سيتم إخطار المعلمين المناسبين.');
        setTimeout(() => {
          router.push('/dashboard/parent/requests');
        }, 2000);
      } else {
        setErrorMsg(res.error || 'فشل إنشاء الطلب العام');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
      setLoading(false);
    }
  };

  const selectedService = serviceTypes.find((s) => s.id === formData.serviceTypeId);
  const isQuickHelp = selectedService?.name === 'شرح مسألة سريعة';

  if (success) {
    return (
      <div className="max-w-2xl mx-auto glass-card bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-2xl text-center space-y-4 animate-fadeIn" dir="rtl">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">تم نشر الطلب العام بنجاح!</h2>
        <p className="text-sm text-muted-foreground">
          لقد أرسلنا إشعارات للمعلمين المتوافقين مع التخصص والصف الدراسي. ستتم إعادة توجيهك الآن إلى صفحة الطلبات لمراجعة العروض فور وصولها.
        </p>
        <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          جاري تحويلك إلى صفحة العروض...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto glass-card bg-card border border-border p-6 sm:p-8 rounded-2xl space-y-6 text-right" dir="rtl">
      <div className="border-b border-border/60 pb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          بيانات طلب المعلم العام
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          قم بنشر تفاصيل الدرس الذي يحتاجه ابنك، وسيقوم المعلمون المؤهلون بتقديم عروض أسعارهم لتختار من بينهم.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2 animate-shake">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* الطالب */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
            <User className="h-4 w-4 text-muted-foreground" />
            الطالب المستهدف
          </label>
          <select
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            className="premium-input w-full text-xs"
            required
          >
            {students.length === 0 ? (
              <option value="">لا يوجد طلاب نشطين</option>
            ) : (
              students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} (الصف {st.grade})
                </option>
              ))
            )}
          </select>
        </div>

        {/* المادة والتخصص */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            المادة / التخصص
          </label>
          <select
            name="subjectId"
            value={formData.subjectId}
            onChange={handleChange}
            className="premium-input w-full text-xs"
            required
          >
            {subjects.length === 0 ? (
              <option value="">لا توجد مواد متوفرة</option>
            ) : (
              subjects.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* نوع الجلسة */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            نوع الجلسة المطلوبة
          </label>
          <select
            name="serviceTypeId"
            value={formData.serviceTypeId}
            onChange={handleServiceChange}
            className="premium-input w-full text-xs"
            required
          >
            {serviceTypes.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.defaultDuration} دقيقة)
              </option>
            ))}
          </select>
        </div>

        {/* موعد الجلسة (الآن) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            موعد الجلسة المطلوبة
          </label>
          <div className="premium-input w-full flex items-center gap-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold">الآن فوراً (بمجرد توفر المعلم)</span>
          </div>
        </div>

      </div>

      {/* عنوان المشكلة أو موضوع الدرس */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground/80">
          {isQuickHelp ? 'عنوان المسألة / موضوع السؤال' : 'موضوع الشرح / عنوان الدرس المطلوب'}
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={isQuickHelp ? 'مثال: حل معادلة تفاضلية من الدرجة الثانية' : 'مثال: شرح درس المصفوفات وقوانينها بالتفصيل'}
          className="premium-input w-full text-xs"
          required
        />
      </div>

      {/* تفاصيل إضافية */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground/80">
          تفاصيل أو ملاحظات إضافية (اختياري)
        </label>
        <textarea
          name="details"
          value={formData.details}
          onChange={handleChange}
          rows={4}
          placeholder="اكتب هنا أي معلومات إضافية تود إخبار المعلم بها قبل الجلسة..."
          className="premium-input w-full text-xs"
        />
      </div>

      {/* رفع صورة المسألة (في حال شرح مسألة سريعة) */}
      {isQuickHelp && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground/80 block">
            صورة للمسألة أو الواجب (اختياري)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex flex-col items-center justify-center border border-dashed border-border hover:border-primary/60 bg-muted/30 p-4 rounded-xl cursor-pointer w-full max-w-xs transition-colors select-none text-center">
              <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-[10px] font-bold">اضغط لرفع صورة مسألة</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
            {uploadingImage && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                جاري رفع الصورة...
              </div>
            )}
            {formData.imageUrl && !uploadingImage && (
              <div className="relative border border-emerald-500/30 bg-emerald-500/5 p-2 rounded-xl flex items-center gap-2 max-w-xs">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-[10px] font-bold text-emerald-600 truncate max-w-[150px]">
                  تم رفع الصورة بنجاح
                </span>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                  className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                >
                  حذف
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* زر الحفظ والنشر */}
      <div className="pt-4 border-t border-border/60 flex justify-end">
        <button
          type="submit"
          className="premium-btn py-3 px-6 text-xs font-bold flex items-center gap-2 w-full sm:w-auto cursor-pointer"
          disabled={loading || uploadingImage}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري نشر طلبك...
            </>
          ) : (
            'نشر الطلب العام للمعلمين'
          )}
        </button>
      </div>
    </form>
  );
}
