'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTutoringOffer } from '@/lib/actions/tutoring-request';
import { Calendar, Clock, CreditCard, Send, Loader2, AlertCircle, CheckCircle, Wifi, WifiOff, FileText } from 'lucide-react';
import { cn, formatLocalTime, formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

type Student = {
  name: string;
  grade: number;
};

type ServiceType = {
  name: string;
};

type TutoringRequest = {
  id: string;
  parentId: string;
  studentId: string;
  specialization: string;
  serviceTypeId: string;
  title: string;
  details: string | null;
  imageUrl: string | null;
  startTime: Date;
  duration: number;
  price: number;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  createdAt: Date;
  student: Student;
  serviceType: ServiceType;
};

type MyOffer = {
  id: string;
  requestId: string;
  teacherId: string;
  price: number;
  notes: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  request: TutoringRequest;
};

interface TeacherRequestsListProps {
  teacherId: string;
  availableRequests: TutoringRequest[];
  myOffers: MyOffer[];
}

export default function TeacherRequestsList({
  teacherId,
  availableRequests: initialAvailable,
  myOffers: initialMyOffers,
}: TeacherRequestsListProps) {
  const router = useRouter();
  
  // حالات الاتصال وقوائم البيانات
  const [activeTab, setActiveTab] = useState<'available' | 'my-offers'>('available');
  const [availableRequests, setAvailableRequests] = useState<TutoringRequest[]>(initialAvailable);
  const [myOffers, setMyOffers] = useState<MyOffer[]>(initialMyOffers);
  
  const [submittingOfferId, setSubmittingOfferId] = useState<string | null>(null);

  // تخزين قيم العروض المدخلة لكل طلب (سعر العرض والملاحظات والمدة)
  const [offerInputs, setOfferInputs] = useState<Record<string, { price: number; duration: number; notes: string }>>(
    initialAvailable.reduce((acc, req) => {
      acc[req.id] = { price: req.price || 50, duration: req.duration || 30, notes: '' };
      return acc;
    }, {} as Record<string, { price: number; duration: number; notes: string }>)
  );

  const handleInputChange = (requestId: string, field: 'price' | 'duration' | 'notes', value: any) => {
    setOfferInputs((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value,
      },
    }));
  };

  // تقديم عرض سعر
  const handleSubmitOffer = async (e: React.FormEvent, requestId: string) => {
    e.preventDefault();
    const input = offerInputs[requestId];
    if (!input || input.price < 5) {
      toast.warning('سعر العرض غير صالح', { description: 'الحد الأدنى للعرض هو 5 شيكل' });
      return;
    }

    setSubmittingOfferId(requestId);
    try {
      const res = await createTutoringOffer({
        requestId,
        price: input.price,
        duration: input.duration,
        notes: input.notes
      });
      if (res.success) {
        toast.success('تم تقديم عرضك لولي الأمر بنجاح!');
        // إزالة الطلب من الطلبات المتاحة وإضافته للعروض المقدمة محلياً للتحديث الفوري
        const requestObject = availableRequests.find((r) => r.id === requestId);
        if (requestObject) {
          setAvailableRequests((prev) => prev.filter((r) => r.id !== requestId));
          // إضافة العرض لقائمة عروضي
          const newOffer: MyOffer = {
            id: Math.random().toString(), // id مؤقت للرندر الفوري
            requestId,
            teacherId,
            price: input.price,
            notes: input.notes || null,
            status: 'PENDING',
            createdAt: new Date(),
            request: requestObject,
          };
          setMyOffers((prev) => [newOffer, ...prev]);
        }
      } else {
        toast.error('فشل تقديم العرض', { description: res.error });
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إرسال العرض');
    } finally {
      setSubmittingOfferId(null);
    }
  };

  const offerStatusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
    REJECTED: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
  };

  const offerStatusLabels: Record<string, string> = {
    PENDING: 'معلق - بانتظار ولي الأمر',
    ACCEPTED: 'مقبول! تم التعاقد',
    REJECTED: 'لم يتم اختيار عرضك',
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* 🔍 تبويبات التنقل */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-2 rounded-2xl border border-border shadow-xs">
        <div className="flex bg-muted/40 p-1 rounded-xl w-full sm:w-auto gap-1">
          <button
            onClick={() => setActiveTab('available')}
            className={cn(
              'px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer',
              activeTab === 'available'
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            📋 الطلبات المتاحة لتخصصك ({availableRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('my-offers')}
            className={cn(
              'px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer',
              activeTab === 'my-offers'
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            🤝 عروضي المقدمة ({myOffers.length})
          </button>
        </div>
      </div>

      {/* 📭 عرض النتائج والبطاقات */}
      {activeTab === 'available' ? (
        availableRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card border border-border border-dashed rounded-2xl text-center">
            <CheckCircle className="h-10 w-10 text-emerald-500/40 mb-3 animate-pulse" />
            <p className="text-sm font-bold text-foreground/80">لا توجد طلبات جديدة حالياً</p>
            <p className="text-xs text-muted-foreground mt-1">
              لقد اطلعت على كافة طلبات مادتك وصفك الدراسي أو لا توجد طلبات جديدة من أولياء الأمور في هذه اللحظة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-200">
            {availableRequests.map((req) => {
              const input = offerInputs[req.id] || { price: req.price, notes: '' };
              
              return (
                <div key={req.id} className="bg-card border border-border rounded-xl p-5 hover-card space-y-4">
                  
                  {/* معلومات الطلب الأساسية */}
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                          {req.specialization}
                        </span>
                        <span className="text-[10px] font-semibold bg-secondary/15 text-secondary-foreground px-2 py-0.5 rounded-full border border-secondary/10">
                          {req.serviceType.name}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-foreground mt-1.5">{req.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        الصف الدراسي: <span className="font-bold text-foreground/80">الصف {req.student.grade}</span>
                      </p>
                    </div>
                    
                    <div className="text-left flex flex-col items-end gap-1">
                      <span className="text-[10px] text-muted-foreground">ميزانية مقترحة (اختياري)</span>
                      <span className="text-base font-black text-primary">{req.price ? formatPrice(req.price) : 'غير محدد'}</span>
                    </div>
                  </div>

                  {req.details && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/40 whitespace-pre-wrap">
                      {req.details}
                    </p>
                  )}

                  {/* تفاصيل الموعد والمرفقات */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground border-y border-border/40 py-2.5 my-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-foreground/80 font-bold">جلسة فورية (تبدأ بمجرد الدفع)</span>
                    </div>
                    {req.imageUrl && (
                      <a
                        href={req.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline font-bold"
                      >
                        <FileText className="h-4 w-4" />
                        عرض الصورة المرفقة للواجب
                      </a>
                    )}
                  </div>

                  {/* نموذج تقديم العرض */}
                  <form onSubmit={(e) => handleSubmitOffer(e, req.id)} className="bg-muted/20 border border-border/50 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end">
                    
                    {/* سعر العرض */}
                    <div className="space-y-1.5 w-full md:w-44">
                      <label className="text-[10px] font-bold text-foreground/70 flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        سعر عرضك (شيكل)
                      </label>
                      <input
                        type="number"
                        min={5}
                        required
                        value={input.price}
                        onChange={(e) => handleInputChange(req.id, 'price', Number(e.target.value))}
                        className="premium-input w-full text-xs"
                      />
                    </div>

                    {/* المدة المطلوبة */}
                    <div className="space-y-1.5 w-full md:w-32">
                      <label className="text-[10px] font-bold text-foreground/70 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        وقت الشرح (دقائق)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        required
                        value={input.duration}
                        onChange={(e) => handleInputChange(req.id, 'duration', Number(e.target.value))}
                        className="premium-input w-full text-xs"
                      />
                    </div>

                    {/* رسالة المعلم */}
                    <div className="space-y-1.5 flex-1 w-full">
                      <label className="text-[10px] font-bold text-foreground/70">
                        رسالة لولي الأمر (ملاحظاتك للطلب)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: متفرغ وجاهز لمساعدتك في حل المسألة فوراً..."
                        value={input.notes}
                        onChange={(e) => handleInputChange(req.id, 'notes', e.target.value)}
                        className="premium-input w-full text-xs"
                      />
                    </div>

                    {/* زر التقديم */}
                    <button
                      type="submit"
                      disabled={submittingOfferId !== null}
                      className="premium-btn py-2 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 w-full md:w-auto"
                    >
                      {submittingOfferId === req.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          جاري التقديم...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          تقديم العرض
                        </>
                      )}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )
      ) : (
        myOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card border border-border border-dashed rounded-2xl text-center">
            <Send className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-bold text-foreground/80">لم تقم بتقديم أي عروض بعد</p>
            <p className="text-xs text-muted-foreground mt-1">
              عندما تقوم بتقديم عروض أسعار على طلبات أولياء الأمور، ستظهر جميعاً وتتمكن من متابعة قبولها هنا.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-200">
            {myOffers.map((off) => (
              <div key={off.id} className="bg-card border border-border rounded-xl p-5 hover-card space-y-4">
                
                {/* رأس البطاقة */}
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                        {off.request.specialization}
                      </span>
                      <span className="text-[10px] font-semibold bg-secondary/15 text-secondary-foreground px-2 py-0.5 rounded-full border border-secondary/10">
                        {off.request.serviceType.name}
                      </span>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', offerStatusStyles[off.status])}>
                        {offerStatusLabels[off.status]}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-foreground mt-1.5">{off.request.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      الطالب: <span className="font-semibold text-foreground/80">الصف {off.request.student.grade}</span>
                    </p>
                  </div>

                  <div className="text-left flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">سعرك المعروض</span>
                    <span className="text-base font-extrabold text-foreground">{formatPrice(off.price)}</span>
                  </div>
                </div>

                {off.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/40">
                    <strong>رسالتك:</strong> {off.notes}
                  </p>
                )}

                {/* تفاصيل الموعد والمدة */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-2.5 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>تاريخ بدء الجلسة: <strong className="text-foreground/80">{formatLocalTime(off.request.startTime)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>المدة المتوقعة: <strong className="text-foreground/80">{off.request.duration} دقيقة</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
