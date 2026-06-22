'use client';

import { useState, useMemo, useEffect } from 'react';
import BookingCard from '@/components/shared/BookingCard';
import type { DetailedBooking } from '@/lib/types';
import { BOOKING_STATUS_AR } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { getLocalDateString, formatTimeOnly } from '@/lib/utils/time';
import { acceptBooking } from '@/lib/actions/booking';
import { toast } from 'sonner';
import Portal from '@/components/shared/Portal';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  List, 
  Search, 
  Check, 
  Video, 
  FileText, 
  X,
  Clock,
  AlertTriangle
} from 'lucide-react';
import InteractiveMessage from '@/components/shared/InteractiveMessage';
import { getDetailedSessionState } from '@/lib/utils/booking-state';

// أسماء الأشهر باللغة العربية
const MONTHS_AR = [
  'كانون الثاني / يناير',
  'شباط / فبراير',
  'آذار / مارس',
  'نيسان / أبريل',
  'أيار / مايو',
  'حزيران / يونيو',
  'تموز / يوليو',
  'آب / أغسطس',
  'أيلول / سبتمبر',
  'تشرين الأول / أكتوبر',
  'تشرين الثاني / نوفمبر',
  'كانون الأول / ديسمبر'
];

// أيام الأسبوع بدءاً من السبت لمطابقة التقويم العربي
const WEEKDAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

interface TeacherBookingsListProps {
  bookings: DetailedBooking[];
}

export default function TeacherBookingsList({ bookings }: TeacherBookingsListProps) {
  // حالات تصفية البحث والفرز
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // حالات طريقة العرض والتوقيت والنافذة المنبثقة
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => getLocalDateString(new Date()));
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // تحديث دوري لتحديث أزرار الانضمام التفاعلية كل 30 ثانية تلقائياً
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const ghostCount = bookings.filter(b => b.status === 'CONFIRMED' && getDetailedSessionState(b.startTime, b.duration).status === 'ghost').length;

  // تصفية الحجوزات بناءً على مدخلات البحث والحالة النشطة
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        b.student.name.toLowerCase().includes(query) ||
        b.parent.name.toLowerCase().includes(query) ||
        b.teacherService.serviceType.name.toLowerCase().includes(query);
        
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // تجميع الحجوزات المفلترة حسب تاريخها المحلي (بتوقيت فلسطين)
  const filteredBookingsByDate = useMemo(() => {
    const groups: Record<string, DetailedBooking[]> = {};
    filteredBookings.forEach((booking) => {
      const dateStr = getLocalDateString(new Date(booking.startTime));
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(booking);
    });
    return groups;
  }, [filteredBookings]);

  // جلب الحجز النشط المحدد للـ Popup من قائمة الحجوزات الكلية (لضمان الفعالية عند تحديث الفلاتر)
  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.id === selectedBookingId);
  }, [bookings, selectedBookingId]);

  // الحجوزات لليوم المحدد (لعرضها أسفل التقويم خصوصاً في الهواتف)
  const selectedDayBookings = useMemo(() => {
    return filteredBookingsByDate[selectedDateStr] || [];
  }, [filteredBookingsByDate, selectedDateStr]);

  // حساب حالة الحصة الزمنية للمساعدة في إظهار الاختصار المناسب
  const getBookingTimeState = (booking: DetailedBooking) => {
    const start = new Date(booking.startTime).getTime();
    const end = start + booking.duration * 60_000;
    const earlyJoinTime = start - 5 * 60_000; // مسموح بالانضمام قبل 5 دقائق

    if (now < earlyJoinTime) {
      return 'waiting';
    } else if (now >= earlyJoinTime && now <= end) {
      return 'active';
    } else {
      return 'expired';
    }
  };

  // معالجة قبول الحجز السريع (Shortcut Action)
  const handleAcceptShortcut = async (bookingId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // منع فتح الـ Popup الخاص بتفاصيل اليوم أو الجلسة
    setLoadingId(bookingId);
    try {
      const res = await acceptBooking(bookingId);
      if (!res.success) {
        toast.error('فشل قبول الحجز', { description: res.error });
      } else {
        toast.success('تم قبول الحجز بنجاح');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ غير متوقع أثناء قبول الحجز');
    } finally {
      setLoadingId(null);
    }
  };

  // التحكم في التنقل الشهري بالتقويم
  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getLocalDateString(today));
  };

  // توليد شبكة التقويم (بما في ذلك تعبئة خلايا الأشهر المجاورة)
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // الحصول على مؤشر اليوم الأول (0 = الأحد، 1 = الاثنين ... 6 = السبت)
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // حساب عدد الخلايا الفارغة قبل بداية الشهر بناءً على أن السبت هو أول أيام الأسبوع
    // إذا كان أول يوم هو السبت (6)، نحتاج 0 خلايا فارغة.
    // إذا كان أول يوم هو الأحد (0)، نحتاج 1 خلية فارغة.
    const prependingCellsCount = (firstDayIndex + 1) % 7;

    const cells: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

    // 1. إضافة أيام الشهر السابق
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    for (let i = prependingCellsCount - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      // نستخدم الساعة 12 ظهراً لتجنب أي مشاكل تتعلق بالتوقيت الصيفي/الشتوي وتغيير التواريخ
      const date = new Date(prevMonthYear, prevMonth, day, 12, 0, 0);
      cells.push({
        date,
        isCurrentMonth: false,
        dateStr: getLocalDateString(date),
      });
    }

    // 2. إضافة أيام الشهر الحالي
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day, 12, 0, 0);
      cells.push({
        date,
        isCurrentMonth: true,
        dateStr: getLocalDateString(date),
      });
    }

    // 3. إضافة أيام الشهر القادم لاستكمال شبكة السطور (مضاعفات 7)
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthDaysToAdd = totalCells - cells.length;

    for (let day = 1; day <= nextMonthDaysToAdd; day++) {
      const date = new Date(nextMonthYear, nextMonth, day, 12, 0, 0);
      cells.push({
        date,
        isCurrentMonth: false,
        dateStr: getLocalDateString(date),
      });
    }

    return cells;
  }, [year, month]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* قسم البحث والتصفية للتقويم والقائمة */}
      <div className="flex flex-col gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">جدول الحصص</h1>
            <p className="text-sm text-muted-foreground mt-1">تتبع جدولك، قم بإدارة مواعيدك، وتواصل مع طلابك</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                viewMode === 'calendar' 
                  ? "bg-primary text-white shadow-md" 
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-border hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>التقويم</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                viewMode === 'list' 
                  ? "bg-primary text-white shadow-md" 
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-border hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <List className="w-4 h-4" />
              <span>القائمة</span>
            </button>
          </div>
        </div>

        {ghostCount > 0 && (
          <InteractiveMessage 
            character="najeeb"
            najeebMode="help"
            message={`تنبيه هام! لديك ${ghostCount} جلسة معلقة لم تقم بإغلاقها ورفع تقريرها لأكثر من 24 ساعة. لن يتم احتساب أرباح هذه الجلسات حتى تقوم بإنهائها.`}
          />
        )}

        {/* 2. شريط الفلاتر والبحث المتطور (شاشات كبيرة) */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ابحث باسم الطالب، ولي الأمر، أو المادة..."
              className="premium-input w-full text-sm ps-10 pe-4 py-2.5 rounded-lg border border-border bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute start-3.5 top-3.5 text-muted-foreground">
              <Search className="h-4.5 w-4.5" />
            </span>
          </div>
          <select
            className="premium-input text-sm md:w-56 py-2.5 px-3 rounded-lg border border-border bg-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">كل حالات الحصص</option>
            <option value="PENDING">بانتظار موافقتي (معلق)</option>
            <option value="CONFIRMED">مؤكد ومجدول</option>
            <option value="COMPLETED">مكتمل ومنتهي</option>
            <option value="CANCELLED">ملغي</option>
            <option value="REJECTED">مرفوض</option>
          </select>
        </div>

        {/* التبديل بين التقويم والقائمة، والتنقل بين الأشهر */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
          {/* زر تبديل وضع العرض */}
          <div className="flex items-center bg-muted/80 dark:bg-accent/40 rounded-lg p-1 border border-border/80">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer",
                viewMode === 'calendar' 
                  ? "bg-card text-foreground shadow-sm border border-border" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              عرض التقويم
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer",
                viewMode === 'list' 
                  ? "bg-card text-foreground shadow-sm border border-border" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              عرض القائمة
            </button>
          </div>

          {/* أدوات التنقل بين الأشهر (تظهر في وضع التقويم فقط) */}
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="الشهر السابق"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="text-sm font-extrabold min-w-[150px] text-center text-foreground bg-accent/20 px-3 py-1.5 rounded-lg border border-border/30">
                {MONTHS_AR[month]} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="الشهر التالي"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleToday}
                className="text-xs font-bold border border-border bg-card hover:bg-accent px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
              >
                اليوم الحالي
              </button>
            </div>
          )}
        </div>
      </div>

      {/* محتوى العرض النشط */}
      {viewMode === 'list' ? (
        // ════════════════════════════════════════════════════
        // طريقة عرض القائمة (القديمة والمحسنة)
        // ════════════════════════════════════════════════════
        filteredBookings.length === 0 ? (
          <p className="text-xs text-muted-foreground py-16 text-center bg-card border border-border rounded-xl">
            لا توجد حجوزات مطابقة لمعايير البحث في القائمة.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role="TEACHER"
              />
            ))}
          </div>
        )
      ) : (
        // ════════════════════════════════════════════════════
        // طريقة عرض التقويم الشهري التفاعلي
        // ════════════════════════════════════════════════════
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm overflow-x-auto">
            <div className="min-w-[760px] md:min-w-full">
              {/* ترويسة أيام الأسبوع بالتقويم */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground pb-3 border-b border-border/80">
                {WEEKDAYS_AR.map((day) => (
                  <div key={day} className="py-2 bg-muted/50 dark:bg-accent/10 rounded-lg border border-border/10">
                    {day}
                  </div>
                ))}
              </div>

              {/* شبكة خلايا الأيام بالتقويم */}
              <div className="grid grid-cols-7 gap-2 mt-3">
                {calendarCells.map(({ date, isCurrentMonth, dateStr }) => {
                  const dayBookings = filteredBookingsByDate[dateStr] || [];
                  const isSelected = dateStr === selectedDateStr;
                  const isCellToday = dateStr === getLocalDateString(new Date());

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={cn(
                        "min-h-[85px] md:min-h-[135px] flex flex-col p-2 bg-card border border-border/60 rounded-xl cursor-pointer hover:border-primary/50 transition-all select-none relative group",
                        !isCurrentMonth && "bg-muted/5 opacity-40 hover:opacity-75",
                        isSelected && "ring-2 ring-primary border-primary bg-primary/[0.02] dark:bg-primary/[0.01]",
                        isCellToday && "border-primary/60 bg-accent/10"
                      )}
                    >
                      {/* رقم اليوم والمؤشرات للهواتف */}
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-xs font-bold h-6.5 w-6.5 rounded-full flex items-center justify-center transition-colors",
                            isCellToday && "bg-primary text-primary-foreground shadow-sm font-black"
                          )}
                        >
                          {date.getDate()}
                        </span>

                        {/* نقاط الحالة (مؤشرات سريعة للشاشات الصغيرة) */}
                        <div className="flex md:hidden gap-0.5 items-center">
                          {dayBookings.slice(0, 3).map((b) => (
                            <span
                              key={b.id}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                b.status === 'PENDING' && "bg-amber-500",
                                b.status === 'CONFIRMED' && "bg-emerald-500",
                                b.status === 'COMPLETED' && "bg-blue-500",
                                (b.status === 'CANCELLED' || b.status === 'REJECTED') && "bg-rose-500"
                              )}
                            />
                          ))}
                          {dayBookings.length > 3 && (
                            <span className="text-[8px] font-black text-muted-foreground">+</span>
                          )}
                        </div>
                      </div>

                      {/* قائمة الحصص المصغرة اليومية (تظهر للشاشات الكبيرة فقط) */}
                      <div className="hidden md:flex flex-col gap-1.5 mt-2 overflow-y-auto max-h-[85px] pe-0.5 scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20 flex-1">
                        {dayBookings.map((b) => {
                          const timeState = b.status === 'CONFIRMED' ? getBookingTimeState(b) : null;
                          
                          // تحديد مظهر الحصة بناءً على حالتها
                          let statusClasses = '';
                          if (b.status === 'PENDING') {
                            statusClasses = 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40';
                          } else if (b.status === 'CONFIRMED') {
                            if (timeState === 'active') {
                              statusClasses = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-400 border-emerald-300/60 dark:border-emerald-800/40 animate-pulse';
                            } else if (timeState === 'expired') {
                              statusClasses = 'bg-purple-50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40';
                            } else {
                              statusClasses = 'bg-blue-50/60 dark:bg-blue-950/20 text-blue-900 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40';
                            }
                          } else if (b.status === 'COMPLETED') {
                            statusClasses = 'bg-slate-50/80 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800';
                          } else {
                            statusClasses = 'bg-rose-50/40 dark:bg-rose-950/10 text-rose-500 dark:text-rose-450 border-rose-100/50 dark:border-rose-950/20 line-through opacity-70';
                          }

                          return (
                            <div
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation(); // منع تغيير تاريخ اليوم المحدد
                                setSelectedBookingId(b.id);
                              }}
                              className={cn(
                                "text-[9.5px] px-2 py-1 rounded-lg border flex items-center justify-between gap-1 group/item transition-all hover:shadow-xs",
                                statusClasses
                              )}
                            >
                              <div className="flex flex-col truncate leading-tight flex-1">
                                <span className="font-extrabold truncate">
                                  {formatTimeOnly(b.startTime)} - {b.student.name}
                                </span>
                                <span className="text-[8.5px] text-muted-foreground/80 truncate font-semibold">
                                  {b.teacherService.serviceType.name}
                                </span>
                              </div>

                              {/* أزرار الإجراءات السريعة (Shortcuts) */}
                              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                {loadingId === b.id ? (
                                  <span className="h-3 w-3 border-2 border-t-transparent border-primary rounded-full animate-spin shrink-0" />
                                ) : (
                                  <>
                                    {/* 1. قبول الحجز السريع للحصص المعلقة */}
                                    {b.status === 'PENDING' && (
                                      <button
                                        onClick={(e) => handleAcceptShortcut(b.id, e)}
                                        className="p-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer transition-colors shadow-xs"
                                        title="قبول فوري للطلب"
                                      >
                                        <Check className="h-2.5 w-2.5" />
                                      </button>
                                    )}

                                    {/* 2. انضمام فوري للفيديو للحصص النشطة */}
                                    {b.status === 'CONFIRMED' && timeState === 'active' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(b.meetingUrl || `https://meet.jit.si/edunest-${b.id}`, '_blank');
                                        }}
                                        className="p-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer transition-colors shadow-xs animate-bounce"
                                        title="انضم للحصة المباشرة"
                                      >
                                        <Video className="h-2.5 w-2.5" />
                                      </button>
                                    )}

                                    {/* 3. فتح نافذة رفع التقرير للحصص المنتهية */}
                                    {b.status === 'CONFIRMED' && timeState === 'expired' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBookingId(b.id);
                                        }}
                                        className="p-0.5 bg-primary hover:bg-primary/95 text-primary-foreground rounded cursor-pointer transition-colors shadow-xs"
                                        title="رفع التقرير الختامي"
                                      >
                                        <FileText className="h-2.5 w-2.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* تفاصيل اليوم المحدد (تعرض قائمة الحصص كاملة في الهواتف، وأسفل التقويم للمراجعة السريعة) */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-foreground border-b border-border/80 pb-3 flex items-center gap-2 flex-wrap">
              <Clock className="h-4.5 w-4.5 text-primary" />
              <span>جدول الحصص ليوم:</span>
              <span className="text-primary font-black bg-primary/10 px-3 py-1 rounded-full text-xs">
                {new Intl.DateTimeFormat('ar-PS', { dateStyle: 'full', timeZone: 'Asia/Hebron' }).format(new Date(selectedDateStr + 'T12:00:00'))}
              </span>
            </h3>

            {selectedDayBookings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                لا توجد حصص مجدولة أو مسجلة في هذا اليوم.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDayBookings.map((b) => {
                  const timeState = b.status === 'CONFIRMED' ? getBookingTimeState(b) : null;
                  return (
                    <div 
                      key={b.id} 
                      className="flex items-center justify-between border border-border p-4 rounded-xl hover:bg-accent/40 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                      onClick={() => setSelectedBookingId(b.id)}
                    >
                      <div className="space-y-1.5 text-right flex-1 truncate">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "text-[10px] font-extrabold px-2 py-0.5 rounded-full border",
                            b.status === 'PENDING' && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400",
                            b.status === 'CONFIRMED' && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400",
                            b.status === 'COMPLETED' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400",
                            (b.status === 'CANCELLED' || b.status === 'REJECTED') && "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400"
                          )}>
                            {BOOKING_STATUS_AR[b.status]}
                          </span>
                          <span className="text-xs font-black text-foreground">{formatTimeOnly(b.startTime)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate font-medium">
                          <span>الطالب: </span>
                          <strong className="text-foreground font-bold">{b.student.name}</strong>
                          <span className="mx-1.5">|</span>
                          <span>المادة: </span>
                          <strong className="text-foreground font-bold">{b.teacherService.serviceType.name}</strong>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0 ms-2">
                        {/* أزرار الإجراءات السريعة في تفاصيل اليوم */}
                        {loadingId === b.id ? (
                          <span className="h-4 w-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                        ) : (
                          <>
                            {b.status === 'PENDING' && (
                              <button
                                onClick={(e) => handleAcceptShortcut(b.id, e)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                              >
                                قبول
                              </button>
                            )}
                            {b.status === 'CONFIRMED' && timeState === 'active' && (
                              <a
                                href={b.meetingUrl || `https://meet.jit.si/edunest-${b.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer animate-pulse shadow-xs"
                              >
                                <Video className="h-3.5 w-3.5" />
                                انضمام
                              </a>
                            )}
                          </>
                        )}
                        <ChevronLeft className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
      // النافذة المنبثقة لعرض التفاصيل الكاملة والتحكم في الحصص
      // ════════════════════════════════════════════════════ */}
      {selectedBooking && (
        <Portal>
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedBookingId(null)}
          >
            <div 
              className="w-full max-w-xl relative bg-card border border-border rounded-2xl shadow-2xl p-1 animate-in zoom-in-95 duration-200 my-8"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* زر الإغلاق الدائري */}
              <button
                onClick={() => setSelectedBookingId(null)}
                className="absolute top-4 end-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border bg-card shadow-xs"
                aria-label="إغلاق النافذة"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* محتوى كارت الجلسة مع كافة أفعالها */}
              <div className="pt-8 max-h-[85vh] overflow-y-auto scrollbar-thin">
                <BookingCard booking={selectedBooking} role="TEACHER" />
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
