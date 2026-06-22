'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { searchAvailableTeachers } from '@/lib/actions/booking';
import { createBooking } from '@/lib/actions/booking';
import { getLocalDateString, PALESTINE_TZ } from '@/lib/utils/time';
import {
  Search,
  User,
  BookOpen,
  CreditCard,
  Loader2,
  AlertCircle,
  UploadCloud,
  CheckCircle,
  Clock,
  Calendar,
  Star,
  MapPin,
  GraduationCap,
  ChevronLeft,
  Sparkles,
  Award,
  BookCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Student = {
  id: string;
  name: string;
  grade: number;
};

type AvailableTeacher = {
  id: string;
  userId: string;
  slug: string;
  userName: string;
  specialization: string;
  city: string | null;
  profileImageUrl: string | null;
  verificationLevel: string;
  averageRating: number;
  totalReviews: number;
  totalSessions: number;
  yearsOfExperience: number;
  education: string | null;
  bio: string | null;
  services: {
    id: string;
    price: number;
    duration: number;
    serviceTypeName: string;
    serviceTypeNameEnglish: string | null;
  }[];
};

type TimeFirstBookingFormProps = {
  students: Student[];
  specializations: string[];
  hasUsedTrial: boolean;
};

// شارة مستوى التوثيق
const VERIFICATION_BADGES: Record<string, { label: string; color: string; icon: string }> = {
  NONE: { label: 'غير موثق', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: '' },
  BRONZE: { label: 'برونزي', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400', icon: '🥉' },
  SILVER: { label: 'فضي', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: '🥈' },
  GOLD: { label: 'ذهبي', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400', icon: '🥇' },
};

export default function TimeFirstBookingForm({
  students,
  specializations,
  hasUsedTrial,
}: TimeFirstBookingFormProps) {
  const router = useRouter();

  // خطوات النموذج
  type Step = 'search' | 'results' | 'details';
  const [currentStep, setCurrentStep] = useState<Step>('search');

  // خطوة البحث
  const [searchQuery, setSearchQuery] = useState({
    selectedSpec: '',
    selectedDate: '',
    selectedTime: '',
  });
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // نتائج البحث
  const [availableTeachers, setAvailableTeachers] = useState<AvailableTeacher[]>([]);

  // خطوة التفاصيل
  const [bookingDetails, setBookingDetails] = useState({
    selectedTeacher: null as AvailableTeacher | null,
    selectedServiceId: '',
    selectedStudentId: students[0]?.id ?? '',
    isTrial: false,
    paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER',
    parentNotes: '',
    questionTitle: '',
    questionDetails: '',
    questionImageUrl: '',
    proofUrl: '',
  });
  const [uploadingProof, setUploadingProof] = useState(false);

  // حالة الإرسال
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // الحد الأدنى للتاريخ
  const minDateString = useMemo(() => getLocalDateString(new Date()), []);

  // توقيتات الساعات المتاحة
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 7; h < 23; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hStr = String(h).padStart(2, '0');
        const mStr = String(m).padStart(2, '0');
        const time = `${hStr}:${mStr}`;
        // تحويل لعرض بصيغة 12 ساعة
        const dateForDisplay = new Date(`2024-01-01T${time}:00`);
        const label = dateForDisplay.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        options.push({ value: time, label });
      }
    }
    return options;
  }, []);

  const activeService = bookingDetails.selectedTeacher?.services.find((s) => s.id === bookingDetails.selectedServiceId);

  const handleSearchChange = (name: string, value: string) => {
    setSearchQuery((prev) => ({ ...prev, [name]: value }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBookingChange = (name: string, value: any) => {
    setBookingDetails((prev) => ({ ...prev, [name]: value }));
  };

  // البحث عن معلمين متاحين
  const handleSearch = async () => {
    if (!searchQuery.selectedSpec) {
      setSearchError('يرجى اختيار المادة');
      return;
    }
    if (!searchQuery.selectedDate) {
      setSearchError('يرجى اختيار التاريخ');
      return;
    }
    if (!searchQuery.selectedTime) {
      setSearchError('يرجى اختيار الوقت');
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const result = await searchAvailableTeachers({
        specialization: searchQuery.selectedSpec,
        date: searchQuery.selectedDate,
        timeSlot: searchQuery.selectedTime,
      });

      if (result.success && result.data) {
        setAvailableTeachers(result.data.teachers);
        setCurrentStep('results');
      } else if (!result.success) {
        setSearchError(result.error);
      }
    } catch (err: unknown) {
      console.error(err);
      setSearchError('حدث خطأ أثناء البحث');
    } finally {
      setSearching(false);
    }
  };

  // اختيار معلم والانتقال للتفاصيل
  const handleSelectTeacher = (teacher: AvailableTeacher) => {
    setBookingDetails((prev) => ({
      ...prev,
      selectedTeacher: teacher,
      selectedServiceId: teacher.services[0]?.id ?? '',
    }));
    setCurrentStep('details');
  };

  // رفع إيصال
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'payment-proofs');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const resData = await res.json();
      setUploadingProof(false);

      if (res.ok && resData.url) {
        handleBookingChange('proofUrl', resData.url);
      } else {
        setErrorMsg(resData.error || 'فشل رفع إيصال التحويل');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء الاتصال بمركز رفع الملفات');
      setUploadingProof(false);
    }
  };

  // إرسال الحجز النهائي
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingDetails.selectedStudentId) {
      setErrorMsg('يرجى تحديد الطالب');
      return;
    }
    if (!bookingDetails.selectedServiceId || !bookingDetails.selectedTeacher) {
      setErrorMsg('يرجى تحديد الخدمة المطلوبة');
      return;
    }


    setLoading(true);
    setErrorMsg(null);

    // بناء startTime من التاريخ والوقت المحددين
    const startTime = new Date(`${searchQuery.selectedDate}T${searchQuery.selectedTime}:00`);

    try {
      const res = await createBooking({
        studentId: bookingDetails.selectedStudentId,
        teacherServiceId: bookingDetails.selectedServiceId,
        startTime,
        isTrial: bookingDetails.isTrial,
        questionTitle: activeService?.serviceTypeName === 'شرح مسألة سريعة' ? bookingDetails.questionTitle : undefined,
        questionDetails: activeService?.serviceTypeName === 'شرح مسألة سريعة' ? bookingDetails.questionDetails : undefined,
        questionImageUrl: activeService?.serviceTypeName === 'شرح مسألة سريعة' ? bookingDetails.questionImageUrl : undefined,
        parentNotes: bookingDetails.parentNotes || undefined,
        paymentMethod: 'ONLINE_CARD',
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

  // عرض اسم الوقت المختار
  const selectedTimeLabel = useMemo(() => {
    if (!searchQuery.selectedTime) return '';
    return timeOptions.find((o) => o.value === searchQuery.selectedTime)?.label ?? searchQuery.selectedTime;
  }, [searchQuery.selectedTime, timeOptions]);

  // تحويل التاريخ لعرض عربي
  const selectedDateLabel = useMemo(() => {
    if (!searchQuery.selectedDate) return '';
    const d = new Date(searchQuery.selectedDate);
    const dayName = new Intl.DateTimeFormat('ar-PS', { timeZone: PALESTINE_TZ, weekday: 'long' }).format(d);
    const dayNum = new Intl.DateTimeFormat('ar-PS', { timeZone: PALESTINE_TZ, day: 'numeric' }).format(d);
    const monthName = new Intl.DateTimeFormat('ar-PS', { timeZone: PALESTINE_TZ, month: 'long' }).format(d);
    return `${dayName}، ${dayNum} ${monthName}`;
  }, [searchQuery.selectedDate]);

  // عدم وجود طلاب
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

  // حالة النجاح
  if (success) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
        <div className="text-center py-8 space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold">تم إرسال طلب الحجز بنجاح!</h2>
          <p className="text-xs text-muted-foreground">بانتظار موافقة المعلم وتأكيد الحجز. يتم نقلك الآن...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* شريط الخطوات */}
      <div className="flex items-center gap-2 mb-2">
        {[
          { key: 'search', label: 'بحث', icon: Search },
          { key: 'results', label: 'النتائج', icon: User },
          { key: 'details', label: 'التأكيد', icon: BookCheck },
        ].map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.key;
          const stepIndex = ['search', 'results', 'details'].indexOf(currentStep);
          const thisIndex = idx;
          const isPast = thisIndex < stepIndex;

          return (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all flex-1 justify-center',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : isPast
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <StepIcon className="h-3.5 w-3.5" />
                {step.label}
              </div>
              {idx < 2 && (
                <div className={cn(
                  'h-0.5 w-4 rounded-full flex-shrink-0',
                  isPast ? 'bg-emerald-400' : 'bg-border'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ الخطوة 1: البحث ═══ */}
      {currentStep === 'search' && (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 animate-fadeIn">
          <h2 className="font-extrabold text-xl border-b border-border pb-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            ابحث عن معلم بالوقت والمادة
          </h2>

          {searchError && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <span>{searchError}</span>
            </div>
          )}

          {/* اختيار المادة */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              المادة الدراسية / التخصص
            </label>
            <select
              value={searchQuery.selectedSpec}
              onChange={(e) => handleSearchChange('selectedSpec', e.target.value)}
              className="w-full premium-input text-xs"
            >
              <option value="">-- اختر المادة المطلوبة --</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* اختيار التاريخ */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              التاريخ المطلوب
            </label>
            <input
              type="date"
              min={minDateString}
              value={searchQuery.selectedDate}
              onChange={(e) => handleSearchChange('selectedDate', e.target.value)}
              className="w-full premium-input text-xs cursor-pointer"
            />
          </div>

          {/* اختيار الوقت */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              الوقت المفضل (بتوقيت فلسطين)
            </label>
            <select
              value={searchQuery.selectedTime}
              onChange={(e) => handleSearchChange('selectedTime', e.target.value)}
              className="w-full premium-input text-xs"
            >
              <option value="">-- اختر الوقت --</option>
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* زر البحث */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {searching ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                جاري البحث عن معلمين متاحين...
              </>
            ) : (
              <>
                <Search className="h-4.5 w-4.5" />
                ابحث عن المعلمين المتاحين
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══ الخطوة 2: النتائج ═══ */}
      {currentStep === 'results' && (
        <div className="space-y-4 animate-fadeIn">
          {/* ملخص البحث */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">نتائج البحث</p>
                  <p className="text-sm font-bold">
                    {searchQuery.selectedSpec} — {selectedDateLabel} — {selectedTimeLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep('search')}
                className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                تعديل البحث
              </button>
            </div>
          </div>

          {availableTeachers.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-3">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg">لا يوجد معلمون متاحون</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                نعتذر، لا يوجد معلمون متاحون لمادة <strong>{searchQuery.selectedSpec}</strong> في الوقت المحدد.
                جرّب تغيير التاريخ أو الوقت.
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep('search')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer"
              >
                تعديل معايير البحث
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground font-semibold px-1">
                تم العثور على <span className="text-primary font-bold">{availableTeachers.length}</span> معلم متاح — اختر المعلم المناسب:
              </p>

              <div className="space-y-3">
                {availableTeachers.map((teacher) => {
                  const badge = VERIFICATION_BADGES[teacher.verificationLevel] || VERIFICATION_BADGES.NONE;
                  const lowestPrice = Math.min(...teacher.services.map((s) => s.price));

                  return (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => handleSelectTeacher(teacher)}
                      className="w-full bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer text-right group"
                    >
                      <div className="flex gap-4">
                        {/* صورة المعلم */}
                        <div className="flex-shrink-0">
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-extrabold text-xl border border-primary/10">
                            {teacher.profileImageUrl ? (
                              <img
                                src={teacher.profileImageUrl}
                                alt={teacher.userName}
                                className="h-14 w-14 rounded-xl object-cover"
                              />
                            ) : (
                              teacher.userName.charAt(0)
                            )}
                          </div>
                        </div>

                        {/* تفاصيل المعلم */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm truncate">{teacher.userName}</h4>
                            {teacher.verificationLevel !== 'NONE' && (
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', badge.color)}>
                                {badge.icon} {badge.label}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                            {teacher.city && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {teacher.city}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <GraduationCap className="h-3 w-3" />
                              {teacher.yearsOfExperience} سنة خبرة
                            </span>
                            {teacher.averageRating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                {teacher.averageRating.toFixed(1)}
                                <span className="text-muted-foreground/60">({teacher.totalReviews})</span>
                              </span>
                            )}
                          </div>

                          {teacher.bio && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">{teacher.bio}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                يبدأ من {lowestPrice} ₪
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {teacher.totalSessions} جلسة مكتملة
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-primary group-hover:underline">
                              اختيار ←
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ الخطوة 3: تفاصيل الحجز ═══ */}
      {currentStep === 'details' && bookingDetails.selectedTeacher && (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-extrabold text-xl flex items-center gap-2">
              <BookCheck className="h-5 w-5 text-primary" />
              تأكيد بيانات الحجز
            </h2>
            <button
              type="button"
              onClick={() => setCurrentStep('results')}
              className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              العودة للنتائج
            </button>
          </div>

          {/* ملخص المعلم والوقت المختار */}
          <div className="bg-accent/30 border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/10">
                {bookingDetails.selectedTeacher.profileImageUrl ? (
                  <img
                    src={bookingDetails.selectedTeacher.profileImageUrl}
                    alt={bookingDetails.selectedTeacher.userName}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  bookingDetails.selectedTeacher.userName.charAt(0)
                )}
              </div>
              <div>
                <p className="text-sm font-bold flex items-center gap-1.5">
                  {bookingDetails.selectedTeacher.userName}
                  {bookingDetails.selectedTeacher.verificationLevel !== 'NONE' && (
                    <Award className="h-3.5 w-3.5 text-primary" />
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {searchQuery.selectedSpec} — {selectedDateLabel} — {selectedTimeLabel}
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="space-y-5">
            {/* اختيار الطالب */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <User className="h-4 w-4" />
                الطالب المستهدف
              </label>
              <select
                value={bookingDetails.selectedStudentId}
                onChange={(e) => handleBookingChange('selectedStudentId', e.target.value)}
                className="w-full premium-input text-xs"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (الصف {s.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* اختيار الخدمة */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                نوع الخدمة المطلوبة
              </label>
              <select
                value={bookingDetails.selectedServiceId}
                onChange={(e) => handleBookingChange('selectedServiceId', e.target.value)}
                className="w-full premium-input text-xs"
              >
                {bookingDetails.selectedTeacher.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.serviceTypeName} (السعر: {s.price} شيكل / {s.duration} دقيقة)
                  </option>
                ))}
              </select>
            </div>

            {/* خيار الجلسة المجانية */}
            {!hasUsedTrial && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900">
                <input
                  type="checkbox"
                  id="trial-time"
                  checked={bookingDetails.isTrial}
                  onChange={(e) => handleBookingChange('isTrial', e.target.checked)}
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="trial-time" className="text-xs font-bold text-purple-800 dark:text-purple-300 cursor-pointer">
                  هل ترغب في حجز هذه الجلسة كـ حصة تجريبية مجانية؟ (30 دقيقة - مرة واحدة لكل ولي أمر)
                </label>
              </div>
            )}

            {/* حقول السؤال السريع */}
            {activeService?.serviceTypeName === 'شرح مسألة سريعة' && (
              <div className="bg-accent/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn">
                <h3 className="text-xs font-bold text-primary">بيانات المسألة السريعة المطلوب شرحها:</h3>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground block">عنوان السؤال / المسألة *</label>
                  <input
                    type="text"
                    name="questionTitle"
                    required
                    value={bookingDetails.questionTitle}
                    onChange={(e) => handleBookingChange('questionTitle', e.target.value)}
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
                    value={bookingDetails.questionDetails}
                    onChange={(e) => handleBookingChange('questionDetails', e.target.value)}
                    placeholder="اكتب تفاصيل المسألة الحسابية أو الدرس المطلوب شرحه بالتفصيل..."
                    className="w-full premium-input text-xs resize-none"
                  />
                </div>
              </div>
            )}

            {/* طريقة الدفع */}
            {!bookingDetails.isTrial && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    طريقة الدفع
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleBookingChange('paymentMethod', 'CASH')}
                      className={cn(
                        'p-3 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-all',
                        bookingDetails.paymentMethod === 'CASH'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border hover:bg-accent'
                      )}
                    >
                      نقداً (مع نهاية الجلسة)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookingChange('paymentMethod', 'BANK_TRANSFER')}
                      className={cn(
                        'p-3 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-all',
                        bookingDetails.paymentMethod === 'BANK_TRANSFER'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border hover:bg-accent'
                      )}
                    >
                      تحويل بنكي (قبل موعد الجلسة)
                    </button>
                  </div>
                </div>

                {/* رفع إيصال التحويل */}
                {bookingDetails.paymentMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-2 border border-dashed border-border rounded-xl p-4 text-center bg-accent/20">
                    <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto" />
                    <span className="text-xs font-bold text-foreground/80 block">إيصال تأكيد التحويل البنكي *</span>
                    <p className="text-[10px] text-muted-foreground">
                      قم بتحويل الرسوم المقررة للبنك، ثم ارفع لقطة شاشة لإثبات التحويل
                    </p>

                    <div className="pt-2 flex justify-center">
                      <input
                        type="file"
                        id="proof-time"
                        accept="image/*"
                        onChange={handleUploadProof}
                        className="hidden"
                      />
                      <label
                        htmlFor="proof-time"
                        className="bg-card border border-border hover:bg-accent text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        {uploadingProof ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : bookingDetails.proofUrl ? (
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

            {/* ملاحظات */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">ملاحظات إضافية للمعلم (اختياري)</label>
              <textarea
                name="parentNotes"
                rows={2}
                value={bookingDetails.parentNotes}
                onChange={(e) => handleBookingChange('parentNotes', e.target.value)}
                placeholder="أي ملاحظات أو تفاصيل تريد مشاركتها مع المعلم..."
                className="w-full text-xs premium-input resize-none"
              />
            </div>

            {/* زر التأكيد */}
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
          </form>
        </div>
      )}
    </div>
  );
}
