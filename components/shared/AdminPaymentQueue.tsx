'use client';

import { useState } from 'react';
import Image from 'next/image';
import { confirmPayment } from '@/lib/actions/admin';
import { CreditCard, Eye, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatLocalTime, formatPrice } from '@/lib/utils';
import DetailsModal from '@/components/shared/DetailsModal';

type PendingPayment = {
  id: string;
  amount: number;
  bankTransferProofUrl: string | null;
  createdAt: Date;
  booking: {
    id: string;
    startTime: Date;
    parent: {
      name: string;
    };
    student: {
      name: string;
    };
    teacherService: {
      serviceType: {
        name: string;
      };
      teacher: {
        user: {
          name: string;
        };
      };
    };
  };
};

type AdminPaymentQueueProps = {
  payments: PendingPayment[];
};

export default function AdminPaymentQueue({ payments }: AdminPaymentQueueProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBookingDetailsId, setSelectedBookingDetailsId] = useState<string | null>(null);

  const activePayment = payments.find((p) => p.id === selectedPaymentId);

  const handleApprove = async () => {
    if (!activePayment) return;
    setLoading(true);
    setErrorMsg(null);

    const res = await confirmPayment(activePayment.booking.id);
    setLoading(false);

    if (res.success) {
      setSelectedPaymentId(null);
      router.refresh();
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* List Queue */}
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm border-b border-border pb-2.5 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-yellow-600" />
          الحوالات والمدفوعات المعلقة ({payments.length})
        </h3>

        {payments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-10 text-center">
            لا توجد حوالات معلقة بانتظار التأكيد حالياً.
          </p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPaymentId(p.id);
                  setErrorMsg(null);
                }}
                className={`w-full text-right p-4 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                  selectedPaymentId === p.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent/40'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-foreground/80">{p.booking.parent.name}</span>
                  <span className="font-extrabold text-primary">{formatPrice(Number(p.amount))}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">خدمة: {p.booking.teacherService.serviceType.name}</span>
                <span className="text-[9px] text-muted-foreground/60 block mt-1">
                  تاريخ الدفع: {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Review Screen */}
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col justify-between">
        {activePayment ? (
          <div className="space-y-6">
            <div className="border-b border-border pb-3 flex justify-between items-start gap-4">
              <div>
                <h3 className="font-extrabold text-base">مراجعة إيصال الحوالة البنكية</h3>
                <span className="text-xs text-muted-foreground">ولي الأمر: {activePayment.booking.parent.name}</span>
              </div>
              <span className="text-sm font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                قيمة الرسوم: {formatPrice(Number(activePayment.amount))}
              </span>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Layout: Info vs screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Info details */}
              <div className="space-y-4 text-xs text-muted-foreground">
                <div className="p-4 border border-border rounded-xl bg-accent/20 space-y-3 text-foreground/80">
                  <span className="font-bold block border-b border-border/50 pb-1.5 text-primary text-[11px]">بيانات الجلسة المجدولة:</span>
                  <div>الخدمة: <strong className="text-foreground">{activePayment.booking.teacherService.serviceType.name}</strong></div>
                  <div>المعلم الخصوصي: <strong className="text-foreground">{activePayment.booking.teacherService.teacher.user.name}</strong></div>
                  <div>الطالب: <strong className="text-foreground">{activePayment.booking.student.name}</strong></div>
                  <div>الموعد: <strong className="text-foreground">{formatLocalTime(activePayment.booking.startTime)}</strong></div>
                  <div className="pt-2 border-t border-border/40 mt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingDetailsId(activePayment.booking.id)}
                      className="text-[10px] font-bold text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground px-2.5 py-1.5 rounded-lg transition-all w-full cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      عرض تفاصيل الحجز كاملة
                    </button>
                  </div>
                </div>
              </div>

              {/* Transfer Proof Screenshot */}
              <div className="border border-border rounded-xl overflow-hidden relative group bg-accent/10">
                {activePayment.bankTransferProofUrl ? (
                  <div className="space-y-2 p-2">
                    <Image
                      src={activePayment.bankTransferProofUrl}
                      alt="Bank Transfer Screenshot"
                      width={800}
                      height={500}
                      className="w-full h-auto max-h-[250px] object-contain rounded-lg border border-border bg-black/5"
                    />
                    <a
                      href={activePayment.bankTransferProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-center items-center gap-1.5 text-[10px] text-primary hover:underline font-semibold py-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      فتح الصورة بالحجم الكامل
                    </a>
                  </div>
                ) : (
                  <div className="p-8 text-center text-rose-500 font-bold text-xs">إيصال التحويل غير متوفر!</div>
                )}
              </div>
            </div>

            {/* Confirm buttons */}
            <div className="border-t border-border pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading}
                className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التأكيد...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    تأكيد استلام الدفعة وتأكيد الحجز
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="m-auto text-center space-y-2">
            <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground">الرجاء اختيار أحد طلبات التحويل الجانبية للمراجعة وتأكيدها.</p>
          </div>
        )}
      </div>
      <DetailsModal 
        isOpen={!!selectedBookingDetailsId} 
        onClose={() => setSelectedBookingDetailsId(null)} 
        entityType="booking" 
        entityId={selectedBookingDetailsId} 
      />
    </div>
  );
}
