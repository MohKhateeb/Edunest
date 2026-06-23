'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Video, CreditCard, Clock, CheckCircle2, Loader2, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
// import { processPayment } from '@/lib/actions/bookings/pay'; // We'll simulate payment for now

interface SessionLobbyClientProps {
  bookingId: string;
  isParent: boolean;
  paymentStatus: string;
  meetingUrl: string | null;
  teacherName: string;
  studentName: string;
  subject: string;
  price: number;
}

export default function SessionLobbyClient({
  bookingId,
  isParent,
  paymentStatus,
  meetingUrl,
  teacherName,
  studentName,
  subject,
  price
}: SessionLobbyClientProps) {
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);

  // Auto-refresh the page every 5 seconds if payment is UNPAID (to catch when parent pays)
  useEffect(() => {
    if (paymentStatus === 'PAID') return;
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [paymentStatus, router]);

  const handleSimulatePayment = async () => {
    setIsPaying(true);
    toast.loading('جاري معالجة الدفع... 💳', { id: 'payment' });
    
    try {
      // In a real app, this calls the payment gateway.
      // We will call an action to mark it as paid.
      const res = await fetch('/api/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      
      if (res.ok) {
        toast.success('تم الدفع بنجاح! جاري تجهيز الغرفة...', { id: 'payment' });
        router.refresh(); // Refresh to get the Meeting URL
      } else {
        toast.error('حدث خطأ في الدفع', { id: 'payment' });
      }
    } catch (error) {
      toast.error('خطأ في الاتصال', { id: 'payment' });
    } finally {
      setIsPaying(false);
    }
  };

  const isPaid = paymentStatus === 'PAID';

  return (
    <div className="max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Avatar Section */}
      <div className="flex items-center justify-center mb-8 relative">
        <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900 border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center shadow-lg">
          <span className="text-3xl font-black text-indigo-500">{teacherName.charAt(0)}</span>
        </div>
        <div className="w-20 border-b-4 border-dashed border-slate-300 dark:border-slate-700 -mx-4 z-0"></div>
        <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900 border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center shadow-lg">
          <span className="text-3xl font-black text-emerald-500">{studentName.charAt(0)}</span>
        </div>
      </div>

      <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">
        غرفة الجلسة: {subject}
      </h1>
      <p className="text-slate-500 mb-10 max-w-lg">
        هذه هي غرفة الانتظار المشتركة. {isParent ? 'قم بالدفع للبدء في جلستك' : 'بانتظار إتمام الدفع لفتح الرابط'}.
      </p>

      {/* Main Status Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background glow based on status */}
        <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-20 ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

        <div className="relative z-10 space-y-6">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
            isPaid 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {isPaid ? 'تم الدفع، الجلسة جاهزة!' : 'بانتظار الدفع...'}
          </div>

          {!isPaid ? (
            <div className="space-y-6">
              {isParent ? (
                <>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 mb-1">المبلغ المطلوب</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{price} ₪</p>
                  </div>
                  
                  <button
                    onClick={handleSimulatePayment}
                    disabled={isPaying}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    ادفع وابدأ الجلسة الآن
                  </button>
                  <p className="text-xs text-slate-400 mt-2">ملاحظة: هذا زر لمحاكاة الدفع حالياً للتبسيط</p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">ننتظر ولي الأمر...</p>
                  <p className="text-sm text-slate-500 mt-1">ولي الأمر الآن في صفحة الدفع. سيظهر الرابط هنا تلقائياً بمجرد نجاح العملية.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in duration-500">
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2">رابط الجلسة الفورية الخاصة بكما</p>
                {meetingUrl ? (
                  <a 
                    href={meetingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xl transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Video className="w-6 h-6" />
                    ادخل الجلسة الآن
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <AlertCircle className="w-5 h-5" /> جاري توليد الرابط... يرجى الانتظار ثانية
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
