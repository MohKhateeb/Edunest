'use client';

import { useState } from 'react';
import { verifyTeacher, rejectTeacher } from '@/lib/actions/admin';
import { ShieldCheck, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VERIFICATION_LEVEL, type VerificationLevel } from '@/lib/enums';
import DetailsModal from '@/components/shared/DetailsModal';

type VerificationRequest = {
  id: string;
  nationalIdUrl: string | null;
  degreeUrl: string | null;
  videoInterviewUrl: string | null;
  createdAt: Date;
  teacher: {
    id: string;
    specialization: string;
    city: string | null;
    education: string | null;
    profileImageUrl: string | null;
    user: {
      name: string;
      email: string;
    };
  };
};

type AdminVerificationQueueProps = {
  requests: VerificationRequest[];
};

export default function AdminVerificationQueue({ requests }: AdminVerificationQueueProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTeacherDetailsId, setSelectedTeacherDetailsId] = useState<string | null>(null);

  const activeRequest = requests.find((r) => r.id === selectedRequestId);

  const handleVerify = async (level: VerificationLevel) => {
    if (!activeRequest) return;
    setLoading(true);
    setErrorMsg(null);

    const res = await verifyTeacher(activeRequest.teacher.id, level);
    setLoading(false);

    if (res.success) {
      setSelectedRequestId(null);
      router.refresh();
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest || !rejectReason.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await rejectTeacher(activeRequest.teacher.id, rejectReason);
    setLoading(false);

    if (res.success) {
      setShowRejectForm(false);
      setRejectReason('');
      setSelectedRequestId(null);
      router.refresh();
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Requests List */}
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm border-b border-border pb-2.5 flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-600" />
          طلبات التوثيق المعلقة ({requests.length})
        </h3>

        {requests.length === 0 ? (
          <p className="text-xs text-muted-foreground py-10 text-center">
            لا توجد طلبات توثيق معلقة جديدة حالياً.
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedRequestId(r.id);
                  setShowRejectForm(false);
                  setErrorMsg(null);
                }}
                className={`w-full text-right p-4 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                  selectedRequestId === r.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:bg-accent/40'
                }`}
              >
                <div className="relative h-9 w-9 rounded-full overflow-hidden bg-accent border border-border flex-shrink-0">
                  {r.teacher.profileImageUrl ? (
                    <img
                      src={r.teacher.profileImageUrl}
                      alt={r.teacher.user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary font-bold text-sm bg-primary/10">
                      {r.teacher.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <span className="font-bold text-xs text-foreground/80 truncate block">{r.teacher.user.name}</span>
                  <span className="text-[10px] text-primary truncate block">{r.teacher.specialization}</span>
                  <span className="text-[9px] text-muted-foreground block">
                    تاريخ الطلب: {new Date(r.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Review Panel */}
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col justify-between">
        {activeRequest ? (
          <div className="space-y-6">
            <div className="border-b border-border pb-3 flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-accent border border-border flex-shrink-0">
                  {activeRequest.teacher.profileImageUrl ? (
                    <img
                      src={activeRequest.teacher.profileImageUrl}
                      alt={activeRequest.teacher.user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary font-bold text-lg bg-primary/10">
                      {activeRequest.teacher.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base">{activeRequest.teacher.user.name}</h3>
                  <span className="text-xs text-primary">{activeRequest.teacher.specialization} | {activeRequest.teacher.user.email}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                الموقع: {activeRequest.teacher.city || 'غير محدد'}
              </span>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Document Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-xl bg-accent/20 space-y-2">
                <span className="text-xs font-bold block">الهوية الوطنية</span>
                {activeRequest.nationalIdUrl ? (
                  <a
                    href={activeRequest.nationalIdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    عرض مستند الهوية
                  </a>
                ) : (
                  <span className="text-xs text-rose-500">غير مرفوع</span>
                )}
              </div>

              <div className="p-4 border border-border rounded-xl bg-accent/20 space-y-2">
                <span className="text-xs font-bold block">الشهادة الجامعية</span>
                {activeRequest.degreeUrl ? (
                  <a
                    href={activeRequest.degreeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    عرض ملف الشهادة
                  </a>
                ) : (
                  <span className="text-xs text-rose-500">غير مرفوع</span>
                )}
              </div>

              <div className="p-4 border border-border rounded-xl bg-accent/20 space-y-2">
                <span className="text-xs font-bold block">مقطع الفيديو</span>
                {activeRequest.videoInterviewUrl ? (
                  <a
                    href={activeRequest.videoInterviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    عرض الفيديو التعريفي
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">غير مرفوع</span>
                )}
              </div>
            </div>

            {/* Educational Info */}
            <div className="flex justify-between items-center bg-accent/20 p-3.5 border border-border rounded-xl">
              <div className="text-xs text-muted-foreground">
                المؤهلات الأكاديمية: <strong className="text-foreground/80">{activeRequest.teacher.education || 'غير محدد'}</strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeacherDetailsId(activeRequest.teacher.id)}
                className="text-[10px] font-bold text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                عرض الملف التعريفي الكامل
              </button>
            </div>

            {/* Decision buttons */}
            <div className="border-t border-border pt-4 flex gap-3 flex-wrap justify-end">
              {showRejectForm ? (
                <form onSubmit={handleRejectSubmit} className="w-full space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">سبب الرفض *</label>
                    <textarea
                      required
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="اكتب سبب رفض طلب التوثيق بالتفصيل ليتم إرساله للمعلم..."
                      className="w-full text-xs premium-input resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="text-xs font-semibold border border-border hover:bg-accent px-4 py-2 rounded-lg cursor-pointer"
                    >
                      تراجع
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg cursor-pointer shadow-sm"
                    >
                      تأكيد الرفض
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="text-xs font-semibold border border-destructive/20 hover:bg-rose-50 text-destructive px-4 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    رفض الطلب
                  </button>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleVerify(VERIFICATION_LEVEL.BRONZE)}
                      disabled={loading}
                      className="text-xs font-semibold bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      توثيق برونزي
                    </button>
                    <button
                      onClick={() => handleVerify(VERIFICATION_LEVEL.SILVER)}
                      disabled={loading}
                      className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      توثيق فضي
                    </button>
                    <button
                      onClick={() => handleVerify(VERIFICATION_LEVEL.GOLD)}
                      disabled={loading}
                      className="text-xs font-semibold bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      توثيق ذهبي
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="m-auto text-center space-y-2">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground">الرجاء اختيار أحد طلبات التوثيق الجانبية للمراجعة واتخاذ القرار.</p>
          </div>
        )}
      </div>
      <DetailsModal 
        isOpen={!!selectedTeacherDetailsId} 
        onClose={() => setSelectedTeacherDetailsId(null)} 
        entityType="teacher" 
        entityId={selectedTeacherDetailsId} 
      />
    </div>
  );
}
