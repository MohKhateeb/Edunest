'use client';

import { useState } from 'react';
import { calculateDraftPayout, createTeacherPayout, markPayoutAsPaid } from '@/lib/actions/payout';
import { BadgeDollarSign, Calculator, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import DetailsModal from '@/components/shared/DetailsModal';

type TeacherOption = {
  id: string;
  name: string;
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

type AdminPayoutsEngineProps = {
  teachers: TeacherOption[];
  existingPayouts: PayoutRecord[];
};

export default function AdminPayoutsEngine({ teachers, existingPayouts }: AdminPayoutsEngineProps) {
  const router = useRouter();
  
  // Drafting form states
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

  // Calculated draft result
  const [draftResult, setDraftResult] = useState<{
    bookingCount: number;
    totalAmount: number;
    commissionAmount: number;
    trialCompensation: number;
    netAmount: number;
  } | null>(null);

  const handleCalculateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !startDate || !endDate) return;

    setLoading(true);
    setErrorMsg(null);
    setDraftResult(null);

    const res = await calculateDraftPayout(
      selectedTeacherId,
      new Date(startDate),
      new Date(endDate)
    );

    setLoading(false);

    if (res.success && res.data) {
      setDraftResult(res.data);
      if (res.data.bookingCount === 0) {
        setErrorMsg('لا توجد حجوزات خصوصية مكتملة أو مستحقة للتسوية في هذه الفترة المحددة');
      }
    } else {
      setErrorMsg(res.success === false ? res.error : 'فشل الاحتساب');
    }
  };

  const handleIssuePayout = async () => {
    if (!selectedTeacherId || !startDate || !endDate || !draftResult) return;
    if (draftResult.bookingCount === 0) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await createTeacherPayout({
      teacherId: selectedTeacherId,
      periodStart: new Date(startDate),
      periodEnd: new Date(endDate),
    });

    setLoading(false);

    if (res.success) {
      setSuccessMsg('تم إصدار وثيقة التسوية المالية للمعلم بنجاح ✓');
      setDraftResult(null);
      setSelectedTeacherId('');
      setStartDate('');
      setEndDate('');
      router.refresh();
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleMarkAsPaid = async (payoutId: string) => {
    setLoading(true);
    const res = await markPayoutAsPaid(payoutId);
    setLoading(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Payout drafting section */}
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            احتساب وإصدار تسوية جديدة
          </h3>
        </div>

        <form onSubmit={handleCalculateDraft} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">المعلم الخصوصي</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                setSelectedTeacherId(e.target.value);
                setDraftResult(null);
              }}
              className="w-full premium-input text-xs"
              required
            >
              <option value="">-- اختر معلماً --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">تاريخ بداية الفترة</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDraftResult(null);
              }}
              className="w-full premium-input text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground block">تاريخ نهاية الفترة</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDraftResult(null);
              }}
              className="w-full premium-input text-xs"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading && !draftResult ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'احسب المستحقات والعمولات'
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
            <span>{successMsg}</span>
          </div>
        )}

        {/* Draft result details */}
        {draftResult && draftResult.bookingCount > 0 && (
          <div className="bg-accent/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn text-xs text-foreground/80">
            <h4 className="font-bold text-primary text-[11px] border-b border-border/50 pb-1.5">مسودة الحساب المقترح للدفعة:</h4>
            
            <div className="flex justify-between">
              <span>عدد الحصص المكتملة:</span>
              <span className="font-bold">{draftResult.bookingCount} حصة</span>
            </div>

            <div className="flex justify-between">
              <span>إجمالي رسوم الحصص:</span>
              <span className="font-bold">{formatPrice(draftResult.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-rose-600 dark:text-rose-400">
              <span>عمولة المنصة (-):</span>
              <span className="font-semibold">-{formatPrice(draftResult.commissionAmount)}</span>
            </div>

            <div className="flex justify-between text-purple-600 dark:text-purple-400">
              <span>تعويضات الحصص المجانية (+):</span>
              <span className="font-semibold">+{formatPrice(draftResult.trialCompensation)}</span>
            </div>

            <div className="flex justify-between border-t border-border/50 pt-2 mt-1 text-sm text-primary font-bold">
              <span>المستحقات الصافية للمعلم:</span>
              <span>{formatPrice(draftResult.netAmount)}</span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleIssuePayout}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'تأكيد وإصدار فاتورة التسوية'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Payouts List */}
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
          <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
          سجل التسويات والفواتير الصادرة للجميع
        </h3>

        {existingPayouts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-10 text-center">
            لم يتم إصدار أي تسويات مالية بعد.
          </p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-muted/55 text-muted-foreground font-semibold border-b border-border">
                  <th className="p-3">المعلم المستحق</th>
                  <th className="p-3">الفترة الزمنية</th>
                  <th className="p-3">رسوم الحصص</th>
                  <th className="p-3">العمولات المقررة</th>
                  <th className="p-3">المبلغ الصافي</th>
                  <th className="p-3 text-left">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {existingPayouts.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-none hover:bg-accent/20">
                    <td className="p-3">
                      <span className="font-bold text-foreground/80">{p.teacher.user.name}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(p.periodStart).toLocaleDateString('ar-EG')} - {new Date(p.periodEnd).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatPrice(p.totalAmount)}
                      {p.trialCompensation > 0 && (
                        <span className="text-[9px] text-purple-600 block">(+ {formatPrice(p.trialCompensation)} تعويض)</span>
                      )}
                    </td>
                    <td className="p-3 text-rose-600 dark:text-rose-400">-{formatPrice(p.commissionAmount)}</td>
                    <td className="p-3 font-bold text-primary">{formatPrice(p.netAmount)}</td>
                    <td className="p-3 text-left">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPayoutId(p.id)}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          تفاصيل
                        </button>
                        {p.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            تم الدفع ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkAsPaid(p.id)}
                            disabled={loading}
                            className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
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
      <DetailsModal 
        isOpen={!!selectedPayoutId} 
        onClose={() => setSelectedPayoutId(null)} 
        entityType="payout" 
        entityId={selectedPayoutId} 
      />
    </div>
  );
}
