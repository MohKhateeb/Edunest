'use client';

import { useMemo, useState } from 'react';
import { getDayOfWeekPalestine, getLocalDateString, PALESTINE_TZ } from '@/lib/utils/time';
import { Clock, Calendar, AlertCircle, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

type SlotPickerProps = {
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  existingBookings: {
    startTime: Date;
    duration: number;
  }[];
  duration: number;
  onChange: (startTime: Date) => void;
};

export default function TimeSlotPicker({
  availability,
  existingBookings,
  duration,
  onChange,
}: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotTime, setSelectedSlotTime] = useState<number | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Get minimum date (today in Palestine local time)
  const minDateString = useMemo(() => getLocalDateString(new Date()), []);

  // Generate date cards for the next 14 days starting from today in Palestine local time
  const dateCards = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = getLocalDateString(d); // "YYYY-MM-DD"
      const dayOfWeek = getDayOfWeekPalestine(d); // 0 to 6
      
      const dayName = new Intl.DateTimeFormat('ar-PS', { timeZone: PALESTINE_TZ, weekday: 'long' }).format(d);
      const dayNum = new Intl.DateTimeFormat('ar-PS', { timeZone: PALESTINE_TZ, day: 'numeric' }).format(d);
      const monthName = new Intl.DateTimeFormat('ar-PS', { timeZone: PALESTINE_TZ, month: 'short' }).format(d);
      
      const isAvailable = availability.some((a) => a.dayOfWeek === dayOfWeek);

      list.push({
        dateStr,
        dayName,
        dayNum,
        monthName,
        isAvailable,
      });
    }
    return list;
  }, [availability]);

  const availableSlots = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    const dateObj = new Date(selectedDate);
    const dayOfWeek = getDayOfWeekPalestine(dateObj);

    // Get tutor availability for this day of week
    const windows = availability.filter((a) => a.dayOfWeek === dayOfWeek);

    if (windows.length === 0) {
      return [];
    }

    const slotsList: { label: string; date: Date; disabled: boolean }[] = [];

    // Parse existing bookings on this selected local date
    const bookingsOnDate = existingBookings.filter((b) => {
      return getLocalDateString(new Date(b.startTime)) === selectedDate;
    });

    const now = new Date();

    windows.forEach((w) => {
      // Convert startTime "HH:MM" and endTime "HH:MM" to local date times
      const startLimit = new Date(`${selectedDate}T${w.startTime}:00`);
      const endLimit = new Date(`${selectedDate}T${w.endTime}:00`);

      // Generate slots every 30 minutes
      const current = new Date(startLimit);

      while (current.getTime() + duration * 60_000 <= endLimit.getTime()) {
        const slotStart = new Date(current);
        const slotEnd = new Date(slotStart.getTime() + duration * 60_000);

        // Check if in the past
        const isPast = slotStart.getTime() < now.getTime();

        // Check overlaps with existing bookings
        const overlaps = bookingsOnDate.some((b) => {
          const bStart = new Date(b.startTime).getTime();
          const bEnd = bStart + b.duration * 60_000;
          return Math.max(slotStart.getTime(), bStart) < Math.min(slotEnd.getTime(), bEnd);
        });

        // format to display
        const label = slotStart.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        slotsList.push({
          label,
          date: slotStart,
          disabled: isPast || overlaps,
        });

        // Advance by 30 minutes
        current.setMinutes(current.getMinutes() + 30);
      }
    });

    // Sort slots by time
    return slotsList.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selectedDate, availability, existingBookings, duration]);

  // Group slots into Morning and Evening
  const morningSlots = useMemo(() => {
    return availableSlots.filter((s) => s.date.getHours() < 12);
  }, [availableSlots]);

  const eveningSlots = useMemo(() => {
    return availableSlots.filter((s) => s.date.getHours() >= 12);
  }, [availableSlots]);

  const handleSlotSelect = (date: Date) => {
    setSelectedSlotTime(date.getTime());
    onChange(date);
  };

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate);
    const dayName = new Intl.DateTimeFormat('ar-PS', { timeZone: PALESTINE_TZ, weekday: 'long' }).format(d);
    const dayNum = new Intl.DateTimeFormat('ar-PS', { timeZone: PALESTINE_TZ, day: 'numeric' }).format(d);
    const monthName = new Intl.DateTimeFormat('ar-PS', { timeZone: PALESTINE_TZ, month: 'long' }).format(d);
    return `${dayName}، ${dayNum} ${monthName}`;
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Date Carousel Selection */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            اختر تاريخ الحصة المطلوب
          </label>
          <button
            type="button"
            onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            {showCustomDatePicker ? '← العودة للتواريخ القريبة' : 'أو اختر تاريخاً آخر...'}
          </button>
        </div>

        {!showCustomDatePicker ? (
          <div className="flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            {dateCards.map((card) => {
              const isSelected = selectedDate === card.dateStr;
              return (
                <button
                  key={card.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(card.dateStr);
                    setSelectedSlotTime(null);
                    onChange(null as any); // reset selection in parent form
                  }}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center w-20 py-3 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : card.isAvailable
                      ? "bg-card border-border hover:border-primary/50 text-foreground"
                      : "bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-muted-foreground/60 opacity-60"
                  )}
                >
                  <span className="text-[10px] font-medium block opacity-75">{card.dayName}</span>
                  <span className="text-lg font-extrabold block my-0.5">{card.dayNum}</span>
                  <span className="text-[10px] block opacity-75">{card.monthName}</span>
                  
                  {card.isAvailable ? (
                    <span className={cn(
                      "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                      isSelected ? "bg-white" : "bg-emerald-500"
                    )} />
                  ) : (
                    <span className="text-[8px] text-muted-foreground scale-90 block mt-0.5 font-medium">عطلة</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1 animate-fadeIn">
            <input
              type="date"
              min={minDateString}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlotTime(null);
                onChange(null as any); // reset selection
              }}
              className="w-full premium-input text-xs cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Slots List */}
      {selectedDate && (
        <div className="space-y-4 border-t border-border/60 pt-4 animate-fadeIn">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            الأوقات المتاحة ليوم <span className="text-foreground font-semibold">{selectedDateLabel}</span> (بتوقيت فلسطين)
          </label>

          {availableSlots.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3.5 py-3 rounded-xl border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900">
              <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
              <span>نعتذر، لا توجد أوقات عمل متاحة للمعلم في هذا اليوم أو تم حجزها بالكامل. يرجى اختيار تاريخ آخر.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Morning Section */}
              {morningSlots.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground/85 flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    الفترة الصباحية
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {morningSlots.map((slot, idx) => {
                      const isSelected = selectedSlotTime === slot.date.getTime();
                      return (
                        <button
                          key={`morning-${idx}`}
                          type="button"
                          disabled={slot.disabled}
                          onClick={() => handleSlotSelect(slot.date)}
                          className={cn(
                            "px-3 py-2.5 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer",
                            slot.disabled
                              ? "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800 cursor-not-allowed line-through opacity-50"
                              : isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                              : "bg-card border-border hover:border-primary hover:text-primary hover:bg-primary/5 text-foreground/80"
                          )}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Evening Section */}
              {eveningSlots.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground/85 flex items-center gap-1.5">
                    <Moon className="h-3.5 w-3.5 text-indigo-500" />
                    الفترة المسائية
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {eveningSlots.map((slot, idx) => {
                      const isSelected = selectedSlotTime === slot.date.getTime();
                      return (
                        <button
                          key={`evening-${idx}`}
                          type="button"
                          disabled={slot.disabled}
                          onClick={() => handleSlotSelect(slot.date)}
                          className={cn(
                            "px-3 py-2.5 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer",
                            slot.disabled
                              ? "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800 cursor-not-allowed line-through opacity-50"
                              : isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                              : "bg-card border-border hover:border-primary hover:text-primary hover:bg-primary/5 text-foreground/80"
                          )}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
