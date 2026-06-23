'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createTeacherPayout, markPayoutAsPaid, markParentRefundAsPaid } from '@/lib/actions/payout';
import { Calculator, BadgeDollarSign, AlertCircle, Loader2, RefreshCcw, Printer, Users, CheckSquare, Square, CheckCircle2, Receipt, Search, Check } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { calculateEarnings } from '@/lib/utils/financial';
import DetailsModal from '@/components/shared/DetailsModal';

export type UnpaidBooking = {
  id: string;
  teacherId: string;
  teacherName: string;
  studentName: string;
  serviceName: string;
  startTime: Date;
  duration: number;
  price: number;
  isTrial: boolean;
  trialCostToPlatform: number;
  appliedCommissionRate: number;
};

type PayoutRecord = {
  id: string;
  totalAmount: number;
  commissionAmount: number;
  trialCompensation: number;
  netAmount: number;
  isPaid: boolean;
  paidAt: Date | null;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  teacher: {
    user: {
      name: string;
    };
  };
};

type ParentRefundRecord = {
  id: string;
  bookingId: string;
  parentName: string;
  amount: number;
  isPaid: boolean;
  paidAt: Date | null;
  createdAt: Date;
};

type AdminPayoutsEngineProps = {
  unpaidBookings: UnpaidBooking[];
  existingPayouts: PayoutRecord[];
  parentRefunds: ParentRefundRecord[];
};

export default function AdminPayoutsEngine({ unpaidBookings, existingPayouts, parentRefunds }: AdminPayoutsEngineProps) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());

  const [payoutToPrint, setPayoutToPrint] = useState<PayoutRecord | null>(null);

  const groupedByTeacher = useMemo(() => {
    const groups: Record<string, {
      teacherId: string;
      teacherName: string;
      bookings: UnpaidBooking[];
      totalNet: number;
      totalCount: number;
    }> = {};

    for (const b of unpaidBookings) {
      if (!groups[b.teacherId]) {
        groups[b.teacherId] = {
          teacherId: b.teacherId,
          teacherName: b.teacherName,
          bookings: [],
          totalNet: 0,
          totalCount: 0
        };
      }
      groups[b.teacherId].bookings.push(b);
      groups[b.teacherId].totalCount++;
      
      const earnings = calculateEarnings(
        b.price,
        b.appliedCommissionRate,
        b.isTrial,
        b.trialCostToPlatform
      );
      const net = earnings.teacherTotalEarnings;
      groups[b.teacherId].totalNet += net;
    }
    return Object.values(groups).sort((a, b) => b.totalNet - a.totalNet);
  }, [unpaidBookings]);

  const handleSelectTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setErrorMsg(null);
    setSuccessMsg(null);
    const teacherGroup = groupedByTeacher.find(g => g.teacherId === teacherId);
    if (teacherGroup) {
      setSelectedBookingIds(new Set(teacherGroup.bookings.map(b => b.id)));
    }
  };

  const handleToggleBooking = (bookingId: string) => {
    setSelectedBookingIds(prev => {
      const next = new Set(prev);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });
  };

  const draftResult = useMemo(() => {
    if (!selectedTeacherId) return null;
    const teacher = groupedByTeacher.find(g => g.teacherId === selectedTeacherId);
    if (!teacher) return null;

    let totalAmount = 0;
    let commissionAmount = 0;
    let trialCompensation = 0;
    let count = 0;

    for (const b of teacher.bookings) {
      if (selectedBookingIds.has(b.id)) {
        count++;
        const earnings = calculateEarnings(
          b.price,
          b.appliedCommissionRate,
          b.isTrial,
          b.trialCostToPlatform
        );
        totalAmount += earnings.totalAmount;
        commissionAmount += earnings.commissionAmount;
        trialCompensation += earnings.trialCompensation;
      }
    }

    return {
      bookingCount: count,
      totalAmount,
      commissionAmount,
      trialCompensation,
      netAmount: totalAmount - commissionAmount + trialCompensation
    };
  }, [selectedTeacherId, groupedByTeacher, selectedBookingIds]);

  const handleIssuePayout = async () => {
    if (!selectedTeacherId || !draftResult || draftResult.bookingCount === 0) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await createTeacherPayout({
      teacherId: selectedTeacherId,
      bookingIds: Array.from(selectedBookingIds),
    });

    setLoading(false);

    if (res.success) {
      setSuccessMsg('تم إصدار وثيقة التسوية المالية للمعلم بنجاح ✓');
      setSelectedTeacherId(null);
      setSelectedBookingIds(new Set());
      router.refresh();
    } else {
      setErrorMsg(res.error || 'حدث خطأ أثناء إصدار التسوية');
    }
  };

  const handleMarkAsPaid = async (payoutId: string) => {
    setLoading(true);
    const res = await markPayoutAsPaid(payoutId);
    setLoading(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'حدث خطأ غير معروف');
    }
  };

  const handleMarkRefundAsPaid = async (refundId: string) => {
    setLoading(true);
    const res = await markParentRefundAsPaid(refundId);
    setLoading(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'حدث خطأ غير معروف');
    }
  };

  const handlePrint = (payout: PayoutRecord) => {
    setPayoutToPrint(payout);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const selectedTeacherGroup = groupedByTeacher.find(g => g.teacherId === selectedTeacherId);

  return (
    <div className="space-y-10 relative">
      {/* Print Only View */}
      {payoutToPrint && (
        <div className="hidden print:block absolute inset-0 bg-white z-[9999] p-10 text-black min-h-screen">
          <div className="flex justify-between items-center border-b-2 border-gray-300 pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800">EduNest</h1>
              <p className="text-sm text-gray-500 mt-1">منصة التعليم الرائدة</p>
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-700">فاتورة تسوية مستحقات</h2>
              <p className="text-sm font-medium text-gray-500 mt-2">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
              <p className="text-sm font-medium text-gray-500">رقم الفاتورة: {payoutToPrint.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          
          <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-4 border-b border-gray-200 pb-2">معلومات المستفيد</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">الاسم</p>
                <p className="font-bold text-gray-800 text-lg">{payoutToPrint.teacher.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">فترة التسوية</p>
                <p className="font-bold text-gray-800 text-lg">
                  {new Date(payoutToPrint.periodStart).toLocaleDateString('ar-EG')} - {new Date(payoutToPrint.periodEnd).toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>
          </div>

          <table className="w-full text-right border-collapse mb-8 border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 border-b border-gray-300 font-bold text-gray-700">البيان</th>
                <th className="p-4 border-b border-gray-300 font-bold text-left text-gray-700">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 border-b border-gray-200 text-gray-800">إجمالي رسوم الحصص الخصوصية</td>
                <td className="p-4 border-b border-gray-200 text-left font-semibold text-gray-800">{formatPrice(payoutToPrint.totalAmount)}</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-gray-200 text-gray-800">عمولة المنصة (مخصومة)</td>
                <td className="p-4 border-b border-gray-200 text-left font-semibold text-red-600">-{formatPrice(payoutToPrint.commissionAmount)}</td>
              </tr>
              {payoutToPrint.trialCompensation > 0 && (
                <tr>
                  <td className="p-4 border-b border-gray-200 text-gray-800">تعويضات الحصص المجانية (مضافة)</td>
                  <td className="p-4 border-b border-gray-200 text-left font-semibold text-green-600">+{formatPrice(payoutToPrint.trialCompensation)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="p-5 font-extrabold text-xl text-gray-900 border-t-2 border-gray-300">الصافي المستحق للتحويل</td>
                <td className="p-5 font-extrabold text-xl text-left text-gray-900 border-t-2 border-gray-300">{formatPrice(payoutToPrint.netAmount)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="text-center mt-20 text-gray-500 text-sm">
            <p>هذه الفاتورة مصدرة إلكترونياً من نظام EduNest ولا تحتاج إلى توقيع يدوي.</p>
            <p className="mt-2">شكراً لجهودكم المستمرة في إثراء المحتوى التعليمي.</p>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="print:hidden space-y-10">
        
        {/* Section 1: Pending Teachers */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">معلمون بانتظار التسوية</h2>
              <p className="text-sm text-muted-foreground mt-1">اختر معلماً لمراجعة حصصه غير المسددة وإصدار التسوية</p>
            </div>
          </div>

          {groupedByTeacher.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">جميع الحسابات مسواة</h3>
              <p className="text-sm text-muted-foreground max-w-sm">لا يوجد حالياً أي معلم لديه حصص معلقة وبانتظار التسوية.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupedByTeacher.map((g) => (
                <button
                  type="button"
                  key={g.teacherId}
                  onClick={() => handleSelectTeacher(g.teacherId)}
                  className={cn(
                    "text-right flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group outline-none",
                    selectedTeacherId === g.teacherId
                      ? "border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 shadow-md ring-2 ring-orange-500/20 scale-[1.02]"
                      : "border-border bg-card hover:border-orange-300 dark:hover:border-orange-700/50 hover:shadow-sm"
                  )}
                >
                  <div className="flex justify-between items-start w-full mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-base line-clamp-1">{g.teacherName}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5" />
                        {g.totalCount} حصص غير مسواة
                      </p>
                    </div>
                    {selectedTeacherId === g.teacherId && (
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="w-full pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">إجمالي المستحقات المتوقعة</p>
                    <p className="font-extrabold text-lg text-primary">{formatPrice(g.totalNet)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Selected Teacher Details & Drafting */}
        {selectedTeacherGroup && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Bookings List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-5 pb-4 border-b border-border">
                    <h3 className="font-bold flex items-center gap-2">
                      <Search className="w-5 h-5 text-orange-500" />
                      تفاصيل الحصص للمعلم: {selectedTeacherGroup.teacherName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <button 
                        type="button"
                        onClick={() => setSelectedBookingIds(new Set(selectedTeacherGroup.bookings.map(b => b.id)))}
                        className="text-primary hover:underline font-medium text-xs"
                      >
                        تحديد الكل
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button 
                        type="button"
                        onClick={() => setSelectedBookingIds(new Set())}
                        className="text-muted-foreground hover:text-foreground font-medium text-xs"
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {selectedTeacherGroup.bookings.map(b => (
                      <div 
                        key={b.id}
                        onClick={() => handleToggleBooking(b.id)}
                        className={cn(
                          "flex items-center p-4 rounded-xl border transition-colors cursor-pointer",
                          selectedBookingIds.has(b.id) 
                            ? "border-primary/40 bg-primary/5" 
                            : "border-border bg-card hover:bg-accent/30"
                        )}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{b.serviceName}</span>
                            <span className="font-semibold text-sm">
                              {b.isTrial ? (
                                <span className="text-purple-600 dark:text-purple-400">مجانية ({formatPrice(b.trialCostToPlatform)})</span>
                              ) : (
                                <span>{formatPrice(b.price)}</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>الطالب: {b.studentName}</span>
                            <span>{new Date(b.startTime).toLocaleDateString('ar-EG')} - {b.duration} دقيقة</span>
                          </div>
                        </div>
                        <div className="mr-4 pr-4 border-r border-border/50 shrink-0">
                          {selectedBookingIds.has(b.id) ? (
                            <CheckSquare className="w-6 h-6 text-primary" />
                          ) : (
                            <Square className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Draft Summary */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-b from-card to-accent/20 border border-border rounded-2xl p-6 shadow-sm sticky top-6">
                  <h3 className="font-bold text-base mb-6 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    مسودة التسوية
                  </h3>
                  
                  {draftResult ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">الحصص المحددة:</span>
                        <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{draftResult.bookingCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">إجمالي الرسوم:</span>
                        <span className="font-bold">{formatPrice(draftResult.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">عمولة المنصة (-):</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">-{formatPrice(draftResult.commissionAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">تعويضات مجانية (+):</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">+{formatPrice(draftResult.trialCompensation)}</span>
                      </div>

                      <div className="pt-4 border-t border-border mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">الصافي المستحق:</span>
                          <span className="font-extrabold text-xl text-primary">{formatPrice(draftResult.netAmount)}</span>
                        </div>
                      </div>

                      {errorMsg && (
                        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20 mt-4">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      {successMsg && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 mt-4">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>{successMsg}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleIssuePayout}
                        disabled={loading || draftResult.bookingCount === 0}
                        className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BadgeDollarSign className="w-5 h-5" />}
                        {loading ? 'جاري الإصدار...' : 'إصدار التسوية الآن'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      يرجى تحديد حصص لحساب مسودة التسوية
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Existing Payouts List */}
        <div>
          <div className="flex items-center gap-3 mb-6 mt-12">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <BadgeDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">سجل التسويات والفواتير</h2>
              <p className="text-sm text-muted-foreground mt-1">التسويات الصادرة سابقاً وحالتها المالية</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {existingPayouts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center flex flex-col items-center">
                <Receipt className="w-12 h-12 mb-3 text-muted-foreground/30" />
                لم يتم إصدار أي تسويات مالية بعد.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <th className="p-4 whitespace-nowrap">رقم الفاتورة</th>
                      <th className="p-4">المعلم المستفيد</th>
                      <th className="p-4">الفترة الزمنية</th>
                      <th className="p-4">الصافي</th>
                      <th className="p-4 text-left">الحالة والإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingPayouts.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-none hover:bg-accent/20 transition-colors">
                        <td className="p-4 text-xs font-mono text-muted-foreground uppercase">
                          #{p.id.slice(-6)}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-foreground">{p.teacher.user.name}</span>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(p.periodStart).toLocaleDateString('ar-EG')} - {new Date(p.periodEnd).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="p-4 font-bold text-primary whitespace-nowrap">
                          {formatPrice(p.netAmount)}
                        </td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handlePrint(p)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent"
                              title="طباعة الفاتورة"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPayoutId(p.id)}
                              className="text-xs font-semibold text-primary hover:underline px-2 py-1"
                            >
                              تفاصيل
                            </button>
                            {p.isPaid ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تم الدفع
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkAsPaid(p.id)}
                                disabled={loading}
                                className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                              >
                                تأكيد التحويل
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Parent Refunds List */}
        <div>
          <div className="flex items-center gap-3 mb-6 mt-12">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <RefreshCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">استردادات أولياء الأمور</h2>
              <p className="text-sm text-muted-foreground mt-1">النزاعات المحسومة والمبالغ المستردة</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {(!parentRefunds || parentRefunds.length === 0) ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                لا توجد مبالغ مستردة لأولياء الأمور حالياً.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <th className="p-4">ولي الأمر المستحق</th>
                      <th className="p-4">تاريخ الاسترداد</th>
                      <th className="p-4">المبلغ المسترد</th>
                      <th className="p-4 text-left">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parentRefunds.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-none hover:bg-accent/20 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-foreground">{r.parentName}</span>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                          {formatPrice(r.amount)}
                        </td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-3">
                            {r.isPaid ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تم الدفع
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkRefundAsPaid(r.id)}
                                disabled={loading}
                                className="bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                              >
                                تأكيد التحويل
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <DetailsModal 
        isOpen={!!selectedPayoutId} 
        onClose={() => setSelectedPayoutId(null)} 
        entityType="payout" 
        entityId={selectedPayoutId} 
      />
    </div>
  );
}

