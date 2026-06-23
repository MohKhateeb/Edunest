'use client';

import { useState } from 'react';
import { toggleTeacherAvailability } from '@/lib/actions/teacher';
import { toast } from 'sonner';
import { Power } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeacherOnlineToggle({ initialStatus }: { initialStatus: boolean }) {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const newStatus = !isOnline;
    // Optimistic update
    setIsOnline(newStatus);
    
    const res = await toggleTeacherAvailability(newStatus);
    if (!res.success) {
      // Revert on failure
      setIsOnline(!newStatus);
      toast.error(res.error || 'فشل في تحديث حالة التواجد');
    } else {
      toast.success(newStatus ? 'أنت الآن متصل وتستقبل الرسائل/الحجوزات الفورية' : 'أنت الآن غير متصل');
    }
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all shadow-sm border",
        isOnline 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" 
          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
        isLoading && "opacity-70 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
      )} />
      <Power className="h-4 w-4" />
      {isOnline ? 'متصل الآن (متاح)' : 'غير متصل (غير متاح)'}
    </button>
  );
}
