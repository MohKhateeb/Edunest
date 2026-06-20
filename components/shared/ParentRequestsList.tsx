'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { acceptTutoringOffer, cancelTutoringRequest } from '@/lib/actions/tutoring-request';
import { Calendar, Clock, UserCheck, Star, Trash2, Briefcase, Loader2, X, Users, Wallet, Sparkles } from 'lucide-react';
import { cn, formatLocalTime, formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

type Teacher = {
  id: string;
  averageRating: number;
  totalReviews: number;
  yearsOfExperience: number;
  profileImageUrl: string | null;
  user: {
    name: string;
  };
};

type TutoringOffer = {
  id: string;
  requestId: string;
  teacherId: string;
  price: number;
  notes: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  teacher: Teacher;
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
  student: {
    name: string;
    grade: number;
  };
  serviceType: {
    name: string;
    nameEnglish: string | null;
  };
  offers: TutoringOffer[];
};

interface ParentRequestsListProps {
  requests: TutoringRequest[];
}

type TabType = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export default function ParentRequestsList({ requests: initialRequests }: ParentRequestsListProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<TutoringRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE');
  const [selectedRequestForOffers, setSelectedRequestForOffers] = useState<TutoringRequest | null>(null);
  const [loadingOfferId, setLoadingOfferId] = useState<string | null>(null);
  const [loadingCancelId, setLoadingCancelId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // قبول عرض المعلم
  const handleAcceptOffer = async (offerId: string) => {
    if (!confirm('هل أنت متأكد من قبول هذا العرض؟ سيتم إنشاء حجز جديد مباشرة.')) return;
    
    setLoadingOfferId(offerId);
    try {
      const res = await acceptTutoringOffer(offerId);
      if (res.success) {
        toast.success('تم قبول العرض بنجاح وإنشاء الحجز! يرجى رفع إيصال الدفع لتأكيده.');
        setSelectedRequestForOffers(null); // إغلاق النافذة المنبثقة
        router.push('/dashboard/parent/bookings');
      } else {
        toast.error('فشل قبول العرض', { description: res.error });
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ غير متوقع أثناء قبول العرض');
    } finally {
      setLoadingOfferId(null);
    }
  };

  // إلغاء طلب معلق
  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟ لن يتمكن المعلمون من تقديم عروض عليه بعد الآن.')) return;
    
    setLoadingCancelId(requestId);
    try {
      const res = await cancelTutoringRequest(requestId);
      if (res.success) {
        toast.success('تم إلغاء الطلب بنجاح');
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? { ...req, status: 'CANCELLED' } : req))
        );
      } else {
        toast.error('فشل إلغاء الطلب', { description: res.error });
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إلغاء الطلب');
    } finally {
      setLoadingCancelId(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'ACTIVE') return req.status === 'PENDING';
    if (activeTab === 'COMPLETED') return req.status === 'ACCEPTED';
    return req.status === 'CANCELLED' || req.status === 'EXPIRED';
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* التبويبات (Tabs) */}
      <div className="flex bg-slate-100/80 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full max-w-md mx-auto overflow-hidden">
        {[
          { id: 'ACTIVE', label: 'الطلبات النشطة' },
          { id: 'COMPLETED', label: 'المنجزة والمقبولة' },
          { id: 'ARCHIVED', label: 'المنتهية والملغاة' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300",
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-primary shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      {filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/30 border border-border/50 border-dashed rounded-[2rem] text-center">
          <div className="mb-5 bg-primary/10 dark:bg-primary/20 p-5 rounded-full ring-8 ring-primary/5">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <p className="text-xl font-black text-foreground mb-2">لا توجد طلبات هنا حالياً</p>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm font-medium leading-relaxed">
            عند إنشاء طلب جديد للبحث عن معلم، سيظهر هنا لتتمكن من متابعة العروض المقدمة.
          </p>
          {activeTab === 'ACTIVE' && (
            <Link
              href="/dashboard/parent/bookings/new?tab=general"
              className="bg-primary hover:bg-primary/95 text-white py-3.5 px-8 rounded-2xl text-sm font-black transition-all hover:scale-105 shadow-lg shadow-primary/25"
            >
              أنشئ أول طلب عام الآن
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRequests.map((request) => {
            const pendingOffers = request.offers.filter(o => o.status === 'PENDING');
            
            return (
              <div
                key={request.id}
                className="group relative bg-white dark:bg-slate-900 border border-border/60 hover:border-primary/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {request.specialization}
                      </span>
                      <span className="text-[10px] font-extrabold bg-secondary/10 text-secondary px-3 py-1 rounded-full">
                        {request.serviceType.name}
                      </span>
                    </div>
                    {request.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={loadingCancelId === request.id}
                        className="text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2 rounded-full transition-colors disabled:opacity-50"
                        title="إلغاء الطلب"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-black text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                    {request.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold mb-4 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-border/40 inline-flex">
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary/70" /> {request.student.name}</span>
                    <span className="w-1.5 h-1.5 bg-border rounded-full"></span>
                    <span>الصف {request.student.grade}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex flex-col gap-1 bg-violet-50/50 dark:bg-violet-950/20 p-3 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                      <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" /> ميزانيتك المقترحة
                      </span>
                      <span className="text-lg font-black text-violet-700 dark:text-violet-300">{formatPrice(request.price)}</span>
                    </div>
                    <div className="flex flex-col gap-1 justify-center px-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                        <Calendar className="h-3.5 w-3.5" /> <span>{formatLocalTime(request.startTime).split('،')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                        <Clock className="h-3.5 w-3.5" /> <span>{request.duration} دقيقة</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border/50">
                  {request.status === 'PENDING' ? (
                    <div className="flex items-center justify-between gap-3">
                      {pendingOffers.length > 0 ? (
                        <div className="flex -space-x-3 -space-x-reverse rtl:space-x-reverse">
                          {pendingOffers.slice(0, 3).map((offer, i) => (
                            <div key={offer.id} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden z-10 relative">
                              {offer.teacher.profileImageUrl ? (
                                <img src={offer.teacher.profileImageUrl} alt="Teacher" className="h-full w-full object-cover" />
                              ) : (
                                offer.teacher.user.name[0]
                              )}
                            </div>
                          ))}
                          {pendingOffers.length > 3 && (
                            <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-muted-foreground z-0 relative">
                              +{pendingOffers.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">جاري انتظار عروض المعلمين...</span>
                      )}

                      <button
                        onClick={() => setSelectedRequestForOffers(request)}
                        className="bg-primary text-white text-xs font-black py-2.5 px-5 rounded-xl hover:bg-primary/90 transition-all hover:scale-105 shadow-md shadow-primary/20 flex-shrink-0"
                      >
                        {pendingOffers.length > 0 ? `استعراض العروض (${pendingOffers.length})` : 'التفاصيل'}
                      </button>
                    </div>
                  ) : request.status === 'ACCEPTED' ? (
                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">تم اختيار معلم وتم الحجز بنجاح 🎉</span>
                      <button onClick={() => setSelectedRequestForOffers(request)} className="text-xs font-black text-emerald-700 dark:text-emerald-400 underline underline-offset-2">عرض التفاصيل</button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center opacity-70">
                      <span className="text-xs font-bold text-muted-foreground">هذا الطلب مغلق ولن يستقبل عروض.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة استعراض العروض (Offers Modal) */}
      {selectedRequestForOffers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-black text-lg text-foreground leading-tight" suppressHydrationWarning>
                  {selectedRequestForOffers.title}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  تصفح عروض المعلمين واختر الأنسب لك
                </p>
              </div>
              <button
                onClick={() => setSelectedRequestForOffers(null)}
                className="h-8 w-8 bg-slate-200/50 dark:bg-slate-800 text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 dark:bg-slate-900/20">
              {/* تفاصيل الطلب السريعة */}
              {selectedRequestForOffers.details && (
                <div className="mb-6 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <h4 className="text-xs font-black text-primary mb-2">وصف طلبك:</h4>
                  <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300" suppressHydrationWarning>
                    {selectedRequestForOffers.details}
                  </p>
                </div>
              )}

              <h4 className="text-sm font-black text-foreground mb-4">العروض المقدمة ({selectedRequestForOffers.offers.length}):</h4>
              
              {selectedRequestForOffers.offers.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  <p className="text-sm font-bold text-slate-500">نبحث حالياً عن معلمين متوافقين... ستظهر العروض هنا فور تقديمها.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedRequestForOffers.offers.map((offer) => {
                    const teacherName = offer.teacher.user.name;
                    const isThisAccepted = offer.status === 'ACCEPTED';
                    const hasAcceptedOffer = selectedRequestForOffers.status === 'ACCEPTED';

                    return (
                      <div
                        key={offer.id}
                        className={cn(
                          'p-5 rounded-3xl flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center transition-all',
                          isThisAccepted
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                            : 'bg-white dark:bg-slate-800 border border-border/80 shadow-sm hover:border-primary/30 hover:shadow-md'
                        )}
                      >
                        {/* بيانات المعلم */}
                        <div className="flex gap-4 items-start w-full sm:w-auto">
                          <div className="h-12 w-12 rounded-full border-2 border-slate-100 dark:border-slate-700 bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                            {offer.teacher.profileImageUrl ? (
                              <img src={offer.teacher.profileImageUrl} alt={teacherName} className="h-full w-full object-cover" />
                            ) : (
                              teacherName[0]
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-foreground">{teacherName}</span>
                              <div className="flex items-center bg-amber-50 dark:bg-amber-950/30 text-amber-600 px-1.5 py-0.5 rounded-lg text-[10px] font-bold">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0 mr-0.5" />
                                <span className="mr-0.5">{offer.teacher.averageRating.toFixed(1)}</span>
                                <span className="text-amber-600/70 mr-0.5">({offer.teacher.totalReviews})</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground font-semibold">
                              خبرة {offer.teacher.yearsOfExperience} سنوات
                            </p>
                            {offer.notes && (
                              <div className="mt-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-border/50 relative">
                                <div className="absolute top-[-4px] right-4 w-2 h-2 bg-slate-50 dark:bg-slate-900 border-t border-l border-border/50 rotate-45"></div>
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed relative z-10" suppressHydrationWarning>
                                  {offer.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* السعر والإجراءات */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-border/50 gap-3">
                          <div className="text-right sm:text-left">
                            <span className="block text-[10px] text-muted-foreground font-bold mb-0.5">السعر المقترح</span>
                            <span className="text-xl font-black text-primary leading-none">{formatPrice(offer.price)}</span>
                          </div>

                          {selectedRequestForOffers.status === 'PENDING' && offer.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleAcceptOffer(offer.id)}
                              disabled={loadingOfferId !== null}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-6 rounded-xl text-xs font-black transition-all hover:scale-105 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 whitespace-nowrap"
                            >
                              {loadingOfferId === offer.id ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> جاري...</>
                              ) : (
                                <>قبول العرض</>
                              )}
                            </button>
                          )}

                          {isThisAccepted && (
                            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5">
                              <UserCheck className="h-4 w-4" /> تم القبول
                            </span>
                          )}
                          
                          {hasAcceptedOffer && !isThisAccepted && (
                            <span className="text-muted-foreground text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              مغلق
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
