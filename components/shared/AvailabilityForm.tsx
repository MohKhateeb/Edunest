'use client';

import { useState } from 'react';
import { DAYS_OF_WEEK_AR } from '@/lib/translations';
import { updateWeeklyAvailability } from '@/lib/actions/availability';
import {
  Trash2,
  Plus,
  Save,
  AlertCircle,
  Copy,
  Check,
  X,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react';

type AvailabilityItem = {
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
};

type AvailabilityFormProps = {
  initialAvailability: AvailabilityItem[];
};

export default function AvailabilityForm({ initialAvailability }: AvailabilityFormProps) {
  const [availability, setAvailability] = useState<AvailabilityItem[]>(
    initialAvailability.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
  );
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inline time adder states
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [inlineStart, setInlineStart] = useState('09:00');
  const [inlineEnd, setInlineEnd] = useState('17:00');

  // Copy schedule modal state
  const [copySourceDay, setCopySourceDay] = useState<number | null>(null);
  const [copyDestDays, setCopyDestDays] = useState<Record<number, boolean>>({});

  // Helper: check if two time slots overlap
  const checkOverlap = (day: number, start: string, end: string, excludeIndex?: number) => {
    return availability.some(
      (s, index) =>
        s.dayOfWeek === day &&
        index !== excludeIndex &&
        ((start >= s.startTime && start < s.endTime) ||
          (end > s.startTime && end <= s.endTime) ||
          (start <= s.startTime && end >= s.endTime))
    );
  };

  // Add inline slot
  const handleAddInlineSlot = (day: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (inlineStart >= inlineEnd) {
      setErrorMsg('وقت الانتهاء يجب أن يكون بعد وقت البدء');
      return;
    }

    if (checkOverlap(day, inlineStart, inlineEnd)) {
      setErrorMsg('هذا الوقت يتداخل مع فترة عمل مضافة مسبقاً في نفس اليوم');
      return;
    }

    const newSlot: AvailabilityItem = {
      dayOfWeek: day,
      startTime: inlineStart,
      endTime: inlineEnd,
    };

    const updated = [...availability, newSlot].sort(
      (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
    );
    setAvailability(updated);
    setAddingDay(null);
  };

  // Remove slot
  const handleRemoveSlot = (day: number, start: string, end: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const updated = availability.filter(
      (item) => !(item.dayOfWeek === day && item.startTime === start && item.endTime === end)
    );
    setAvailability(updated);
  };

  // Clear slots for a single day
  const handleClearDay = (day: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const updated = availability.filter((item) => item.dayOfWeek !== day);
    setAvailability(updated);
  };

  // Open copy schedule modal
  const openCopyModal = (day: number) => {
    setCopySourceDay(day);
    const initialDests: Record<number, boolean> = {};
    Object.keys(DAYS_OF_WEEK_AR).forEach((key) => {
      const d = Number(key);
      if (d !== day) {
        initialDests[d] = false;
      }
    });
    setCopyDestDays(initialDests);
  };

  // Apply copy schedule to checked days
  const handleApplyCopy = () => {
    if (copySourceDay === null) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Get source slots
    const sourceSlots = availability.filter((item) => item.dayOfWeek === copySourceDay);

    // Filter out destination days where we want to overwrite
    const selectedDays = Object.entries(copyDestDays)
      .filter(([_, checked]) => checked)
      .map(([dayStr]) => Number(dayStr));

    if (selectedDays.length === 0) {
      setCopySourceDay(null);
      return;
    }

    // Keep only slots that belong to non-selected days
    let updated = availability.filter((item) => !selectedDays.includes(item.dayOfWeek));

    // Duplicate source slots to each selected day
    selectedDays.forEach((destDay) => {
      sourceSlots.forEach((slot) => {
        updated.push({
          dayOfWeek: destDay,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      });
    });

    updated.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
    setAvailability(updated);
    setCopySourceDay(null);
    setSuccessMsg('تم نسخ جدول التوفر للأيام المحددة بنجاح (يرجى حفظ التغييرات)');
  };

  // Presets: Apply standard 9am-5pm to Sunday-Thursday (0 to 4)
  const applyStandardPresets = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Confirmation fallback
    const confirm = window.confirm('سيتم استبدال جدول التوفر الحالي بجدول قياسي (9:00 - 17:00) من الأحد إلى الخميس. هل تريد المتابعة؟');
    if (!confirm) return;

    const standardSlots: AvailabilityItem[] = [];
    for (let d = 0; d <= 4; d++) {
      standardSlots.push({
        dayOfWeek: d,
        startTime: '09:00',
        endTime: '17:00',
      });
    }

    setAvailability(standardSlots);
    setSuccessMsg('تم تطبيق الجدول القياسي المقترح. يرجى الضغط على حفظ التغييرات لتثبيته.');
  };

  // Presets: Clear all availability
  const clearAllAvailability = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const confirm = window.confirm('هل أنت متأكد من رغبتك في تصفير وحذف جميع فترات التوفر بالكامل؟');
    if (!confirm) return;

    setAvailability([]);
  };

  // Save changes via Server Action
  const handleSave = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateWeeklyAvailability(availability);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('تم حفظ أوقات التوفر بنجاح في النظام');
    } else {
      setErrorMsg(res.error || 'حدث خطأ أثناء حفظ التغييرات');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner and Quick Presets */}
      <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all hover:shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">جدول التوفر الأسبوعي المعتاد</h1>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            حدد أوقات تفرغك المعتادة أسبوعياً لتقديم الجلسات التعليمية. لن يتمكن أولياء الأمور من حجز حصص معك خارج هذه الفترات المعتمدة.
          </p>
        </div>

        {/* Global Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyStandardPresets}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            تعبئة سريعة (أيام العمل 9-17)
          </button>
          <button
            type="button"
            onClick={clearAllAvailability}
            className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            تصفير الجدول
          </button>
        </div>
      </div>

      {/* Errors / Success alerts */}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900 shadow-sm transition-all duration-300 animate-in fade-in">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900 shadow-sm transition-all duration-300 animate-in fade-in">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Weekly Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {Object.entries(DAYS_OF_WEEK_AR).map(([key, dayName]) => {
          const day = Number(key);
          const daySlots = availability.filter((item) => item.dayOfWeek === day);

          return (
            <div
              key={day}
              className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col min-h-[300px] shadow-sm hover:shadow-md transition-all relative"
            >
              {/* Day Header */}
              <div className="flex justify-between items-center pb-3 border-b border-border mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">{dayName}</span>
                </div>
                {/* Count badge */}
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                  {daySlots.length} فترات
                </span>
              </div>

              {/* Day Action Icons */}
              <div className="flex items-center gap-1 mb-3 justify-end text-muted-foreground">
                {daySlots.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => openCopyModal(day)}
                      className="p-1 hover:text-primary hover:bg-accent rounded-lg transition-colors cursor-pointer"
                      title="نسخ هذا اليوم لأيام أخرى"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearDay(day)}
                      className="p-1 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                      title="مسح أوقات هذا اليوم"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Time Slots List */}
              <div className="flex-1 space-y-2 mb-3">
                {daySlots.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-8">
                    <span className="text-xs text-muted-foreground bg-accent/40 px-3 py-1.5 rounded-xl border border-dashed border-border w-full text-center">
                      مغلق
                    </span>
                  </div>
                ) : (
                  daySlots.map((slot, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between gap-1 px-2.5 py-1.5 bg-accent/30 border border-border rounded-xl text-[11px] font-semibold text-foreground/80 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{slot.startTime}</span>
                        <span>-</span>
                        <span>{slot.endTime}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(day, slot.startTime, slot.endTime)}
                        className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                        title="حذف هذه الفترة"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Inline Quick Adder */}
              <div>
                {addingDay === day ? (
                  <div className="bg-accent/40 rounded-xl p-2.5 border border-border space-y-2.5 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap min-w-[24px]">من</span>
                        <input
                          type="time"
                          value={inlineStart}
                          onChange={(e) => setInlineStart(e.target.value)}
                          className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-primary text-center"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap min-w-[24px]">إلى</span>
                        <input
                          type="time"
                          value={inlineEnd}
                          onChange={(e) => setInlineEnd(e.target.value)}
                          className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-primary text-center"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddInlineSlot(day)}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        إضافة
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingDay(null)}
                        className="bg-accent border border-border hover:bg-accent/80 text-xs font-bold p-1.5 rounded-lg transition-colors cursor-pointer text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setInlineStart('09:00');
                      setInlineEnd('17:00');
                      setAddingDay(day);
                    }}
                    className="w-full py-2 border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-1 cursor-pointer hover:bg-primary/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة فترة
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-2 bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          <Save className="h-4.5 w-4.5" />
          {loading ? 'جاري الحفظ والتوثيق...' : 'حفظ التغييرات في الجدول'}
        </button>
      </div>

      {/* Copy Schedule Overlay Modal */}
      {copySourceDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base text-foreground">نسخ جدول يوم {DAYS_OF_WEEK_AR[copySourceDay]}</h3>
                <p className="text-[11px] text-muted-foreground">اختر الأيام الأخرى التي ترغب في نسخ هذا الجدول إليها:</p>
              </div>
              <button
                type="button"
                onClick={() => setCopySourceDay(null)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-accent rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Checklist of Destination Days */}
            <div className="space-y-2 border-y border-border py-3">
              {Object.entries(DAYS_OF_WEEK_AR).map(([key, dayName]) => {
                const d = Number(key);
                if (d === copySourceDay) return null;

                return (
                  <label
                    key={d}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent/40 cursor-pointer transition-colors text-xs font-semibold text-foreground/80"
                  >
                    <input
                      type="checkbox"
                      checked={copyDestDays[d] || false}
                      onChange={(e) =>
                        setCopyDestDays({
                          ...copyDestDays,
                          [d]: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>{dayName}</span>
                  </label>
                );
              })}
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCopySourceDay(null)}
                className="bg-accent border border-border hover:bg-accent/80 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer text-muted-foreground"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyCopy}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                تطبيق النسخ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
