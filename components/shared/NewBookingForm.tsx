'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBooking } from '@/lib/actions/booking';
import TimeSlotPicker from './TimeSlotPicker';
import { User, BookOpen, CreditCard, Loader2, AlertCircle, UploadCloud, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

type TeacherService = {
  id: string;
  price: number;
  duration: number;
  serviceType: ServiceType;
};

type Teacher = {
  id: string;
  userId: string;
  slug: string;
  profileImageUrl: string | null;
  user: {
    name: string;
  };
  services: TeacherService[];
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  bookings: {
    startTime: Date;
    duration: number;
  }[];
};

type NewBookingFormProps = {
  students: Student[];
  teachers: Teacher[];
  hasUsedTrial: boolean;
};

export default function NewBookingForm({ students, teachers, hasUsedTrial }: NewBookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherParam = searchParams.get('teacher');
  const serviceParam = searchParams.get('service');
  const initialTutor = teacherParam
    ? teachers.find((teacher) => teacher.slug === teacherParam)
    : undefined;
  const initialService = serviceParam
    ? initialTutor?.services.find((service) => service.id === serviceParam)
    : undefined;

  // Selected tutor parameters
  const [formData, setFormData] = useState({
    selectedTutorId: initialTutor?.id ?? '',
    selectedServiceId: initialService?.id ?? '',
    selectedStudentId: students[0]?.id ?? '',
    isTrial: false,
    startTime: null as Date | null,
    paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER',
    parentNotes: '',
    questionTitle: '',
    questionDetails: '',
    questionImageUrl: '',
    proofUrl: '',
  });
  const [uploadingProof, setUploadingProof] = useState(false);

  // General submission state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeTutor = teachers.find((t) => t.id === formData.selectedTutorId);
  const activeService = activeTutor?.services.find((s) => s.id === formData.selectedServiceId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCustomChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle bank transfer screenshot upload
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    setErrorMsg(null);

    const data = new FormData();
    data.append('file', file);
    data.append('bucket', 'payment-proofs');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const resData = await res.json();
      setUploadingProof(false);

      if (res.ok && resData.url) {
        handleCustomChange('proofUrl', resData.url);
      } else {
        setErrorMsg(resData.error || 'فشل رفع إيصال التحويل');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء الاتصال بمركز رفع الملفات');
      setUploadingProof(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedStudentId) {
      setErrorMsg('يرجى تحديد الطالب');
      return;
    }
    if (!formData.selectedTutorId) {
      setErrorMsg('يرجى تحديد المعلم');
      return;
    }
    if (!formData.selectedServiceId) {
      setErrorMsg('يرجى تحديد نوع الخدمة المطلوب حجزها');
      return;
    }
    if (!formData.startTime) {
      setErrorMsg('يرجى تحديد تاريخ ووقت الجلسة المطلوب');
      return;
    }

    if (formData.paymentMethod === 'BANK_TRANSFER' && !formData.isTrial && !formData.proofUrl) {
      setErrorMsg('يرجى رفع إيصال التحويل البنكي للمتابعة');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await createBooking({
        studentId: formData.selectedStudentId,
        teacherServiceId: formData.selectedServiceId,
        startTime: formData.startTime,
        isTrial: formData.isTrial,
        questionTitle: activeService?.serviceType.name === 'شرح مسألة سريعة' ? formData.questionTitle : undefined,
        questionDetails: activeService?.serviceType.name === 'شرح مسألة سريعة' ? formData.questionDetails : undefined,
        questionImageUrl: activeService?.serviceType.name === 'شرح مسألة سريعة' ? formData.questionImageUrl : undefined,
        parentNotes: formData.parentNotes || undefined,
        paymentMethod: formData.paymentMethod,
        bankTransferProofUrl: formData.paymentMethod === 'BANK_TRANSFER' ? formData.proofUrl : undefined,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/parent/bookings');
        }, 2000);
      } else {
        setErrorMsg(res.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('حدث خطأ غير متوقع أثناء إتمام الحجز');
      setLoading(false);
    }
  };

  if (students.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
        <h3 className="font-extrabold text-lg">لم تقم بإضافة طلاب بعد</h3>
        <p className="text-xs text-muted-foreground">
          يجب عليك إضافة طالب واحد على الأقل لحسابك لتتمكن من حجز الحصص والدروس.
        </p>
        <button
          onClick={() => router.push('/dashboard/parent/students')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer"
        >
          اذهب لإضافة طالب
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold">تم إرسال طلب الحجز بنجاح!</h2>
            <p className="text-xs text-muted-foreground">بانتظار موافقة المعلم وتأكيد الحجز. يتم نقلك الآن...</p>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            <h2 className="font-extrabold text-xl border-b border-border pb-3 flex items-center gap-2">
              جدولة حجز جلسة جديدة
            </h2>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Student Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <User className="h-4 w-4" />
                الطالب المستهدف
              </label>
              <select
                value={formData.selectedStudentId}
                onChange={(e) => handleCustomChange('selectedStudentId', e.target.value)}
                className="w-full premium-input text-xs"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (الصف {s.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Teacher Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <User className="h-4 w-4" />
                اختيار المعلم الخصوصي
              </label>
              <select
                value={formData.selectedTutorId}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    selectedTutorId: e.target.value,
                    selectedServiceId: '',
                    startTime: null,
                  }));
                }}
                className="w-full premium-input text-xs"
              >
                <option value="">-- اختر معلماً من القائمة --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.selectedTutorId && activeTutor && (
              <div className="flex items-center gap-3 p-4 bg-accent/40 rounded-xl border border-border animate-fadeIn">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-accent border border-border flex-shrink-0">
                  {activeTutor.profileImageUrl ? (
                    <img
                      src={activeTutor.profileImageUrl}
                      alt={activeTutor.user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary font-bold text-lg bg-primary/10">
                      {activeTutor.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{activeTutor.user.name}</h4>
                  <p className="text-xs text-muted-foreground">معلم معتمد وموثق على المنصة</p>
                </div>
              </div>
            )}

            {/* 3. Service Selection */}
            {formData.selectedTutorId && activeTutor && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  نوع الخدمة المطلوبة
                </label>
                <select
                  value={formData.selectedServiceId}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      selectedServiceId: e.target.value,
                      startTime: null,
                    }));
                  }}
                  className="w-full premium-input text-xs"
                >
                  <option value="">-- اختر الخدمة المطلوبة --</option>
                  {activeTutor.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.serviceType.name} (السعر: {s.price} شيكل / {s.duration} دقيقة)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Free Trial Option */}
            {formData.selectedServiceId && !hasUsedTrial && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900">
                <input
                  type="checkbox"
                  id="trial"
                  checked={formData.isTrial}
                  onChange={(e) => handleCheckboxChange('isTrial', e.target.checked)}
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="trial" className="text-xs font-bold text-purple-800 dark:text-purple-300 cursor-pointer">
                  هل ترغب في حجز هذه الجلسة كـ حصة تجريبية مجانية؟ (30 دقيقة - مرة واحدة لكل ولي أمر)
                </label>
              </div>
            )}

            {/* Quick help fields */}
            {activeService?.serviceType.name === 'شرح مسألة سريعة' && (
              <div className="bg-accent/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn">
                <h3 className="text-xs font-bold text-primary">بيانات المسألة السريعة المطلوب شرحها:</h3>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground block">عنوان السؤال / المسألة *</label>
                  <input
                    type="text"
                    name="questionTitle"
                    required
                    value={formData.questionTitle}
                    onChange={handleChange}
                    placeholder="مثال: حل معادلة تفاضلية من الدرجة الثانية"
                    className="w-full premium-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground block">تفاصيل المسألة أو الواجب الدراسي *</label>
                  <textarea
                    name="questionDetails"
                    required
                    rows={3}
                    value={formData.questionDetails}
                    onChange={handleChange}
                    placeholder="اكتب تفاصيل المسألة الحسابية أو الدرس المطلوب شرحه بالتفصيل..."
                    className="w-full premium-input text-xs resize-none"
                  />
                </div>
              </div>
            )}

            {/* 4. Slot Picker */}
            {formData.selectedServiceId && activeTutor && (
              <div className="border-t border-border pt-4">
                <TimeSlotPicker
                  availability={activeTutor.availability}
                  existingBookings={activeTutor.bookings}
                  duration={formData.isTrial ? 30 : activeService?.duration || 60}
                  onChange={(date) => handleCustomChange('startTime', date)}
                />
              </div>
            )}

            {/* 5. Payment details */}
            {formData.startTime && !formData.isTrial && (
              <div className="border-t border-border pt-4 space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    طريقة الدفع
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleCustomChange('paymentMethod', 'CASH')}
                      className={cn(
                        "p-3 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-all",
                        formData.paymentMethod === 'CASH'
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border hover:bg-accent"
                      )}
                    >
                      نقداً (مع نهاية الجلسة)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCustomChange('paymentMethod', 'BANK_TRANSFER')}
                      className={cn(
                        "p-3 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-all",
                        formData.paymentMethod === 'BANK_TRANSFER'
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border hover:bg-accent"
                      )}
                    >
                      تحويل بنكي (قبل موعد الجلسة)
                    </button>
                  </div>
                </div>

                {/* Proof screenshot only for Bank Transfer */}
                {formData.paymentMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-2 border border-dashed border-border rounded-xl p-4 text-center bg-accent/20">
                    <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto" />
                    <span className="text-xs font-bold text-foreground/80 block">إيصال تأكيد التحويل البنكي *</span>
                    <p className="text-[10px] text-muted-foreground">قم بتحويل الرسوم المقررة للبنك، ثم ارفع لقطة شاشة لإثبات التحويل</p>

                    <div className="pt-2 flex justify-center">
                      <input
                        type="file"
                        id="proof"
                        accept="image/*"
                        onChange={handleUploadProof}
                        className="hidden"
                      />
                      <label
                        htmlFor="proof"
                        className="bg-card border border-border hover:bg-accent text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        {uploadingProof ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : formData.proofUrl ? (
                          'تم رفع الإيصال بنجاح ✓'
                        ) : (
                          'اختر ملف الصورة للرفع'
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {formData.startTime && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">ملاحظات إضافية للمعلم (اختياري)</label>
                <textarea
                  name="parentNotes"
                  rows={2}
                  value={formData.parentNotes}
                  onChange={handleChange}
                  placeholder="أي ملاحظات أو تفاصيل تريد مشاركتها مع المعلم..."
                  className="w-full text-xs premium-input resize-none"
                />
              </div>
            )}

            {/* Confirm Book */}
            {formData.startTime && (
              <div className="border-t border-border pt-4">
                <button
                  type="submit"
                  disabled={loading || uploadingProof}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      جاري معالجة وحفظ الحجز...
                    </>
                  ) : (
                    'تأكيد طلب حجز الجلسة'
                  )}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
