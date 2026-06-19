'use client';

import { useState, useEffect } from 'react';
import { submitVerificationDocuments } from '@/lib/actions/teacher';
import { UploadCloud, CheckCircle2, ShieldAlert, FileText, Loader2, AlertCircle, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

type VerificationData = {
  nationalIdUrl: string | null;
  degreeUrl: string | null;
  videoInterviewUrl: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
};

type TeacherVerificationFormProps = {
  initialData: VerificationData | null;
  isVerified: boolean;
};

export default function TeacherVerificationForm({ initialData, isVerified }: TeacherVerificationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nationalIdUrl: initialData?.nationalIdUrl || '',
    degreeUrl: initialData?.degreeUrl || '',
    videoInterviewUrl: initialData?.videoInterviewUrl || '',
  });

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        nationalIdUrl: initialData.nationalIdUrl || '',
        degreeUrl: initialData.degreeUrl || '',
        videoInterviewUrl: initialData.videoInterviewUrl || '',
      });
    }
  }, [initialData]);

  const [uploadingField, setUploadingField] = useState<'id' | 'degree' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUrlChange = (field: 'id' | 'degree' | 'video', url: string) => {
    const fieldMap = {
      id: 'nationalIdUrl' as const,
      degree: 'degreeUrl' as const,
      video: 'videoInterviewUrl' as const,
    };
    setFormData((prev) => ({ ...prev, [fieldMap[field]]: url }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'id' | 'degree' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    setErrorMsg(null);

    const data = new FormData();
    data.append('file', file);
    data.append('bucket', 'verifications');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const resData = await res.json();
      setUploadingField(null);

      if (res.ok && resData.url) {
        handleUrlChange(field, resData.url);
      } else {
        setErrorMsg(resData.error || 'فشل رفع الملف');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء رفع الملف إلى الخادم');
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nationalIdUrl || !formData.degreeUrl) {
      setErrorMsg('يرجى رفع الهوية الوطنية والشهادة الجامعية على الأقل للمتابعة');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await submitVerificationDocuments({
        nationalIdUrl: formData.nationalIdUrl,
        degreeUrl: formData.degreeUrl,
        videoInterviewUrl: formData.videoInterviewUrl || undefined,
      });

      if (res.success) {
        setSuccessMsg('تم رفع وثائق التوثيق وإرسالها للمراجعة بنجاح ✓');
        router.refresh();
      } else {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('حدث خطأ غير متوقع أثناء إرسال الوثائق');
    } finally {
      setLoading(false);
    }
  };

  // Status banners
  const hasSubmitted = !!initialData;
  const isPending = hasSubmitted && !initialData.reviewedAt;
  const isRejected = hasSubmitted && !!initialData.rejectionReason;
  const isFieldsDisabled = isVerified || isPending;

  return (
    <div className="bg-card border border-border rounded-xl p-8 space-y-6 shadow-sm">
      <div>
        <h2 className="font-extrabold text-xl mb-1">توثيق الملف الأكاديمي</h2>
        <p className="text-xs text-muted-foreground">
          ارفع وثائقك الرسمية لتتم مراجعتها وتوثيق ملفك بbadge برونزي/فضي/ذهبي، مما يزيد من ظهورك وثقة الأهالي بك.
        </p>
      </div>

      {/* Verification Status Banner */}
      {isVerified ? (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold block">الملف موثق ومفعل</span>
            <p>لقد تمت مراجعة ملفك وتوثيقه بنجاح من إدارة المنصة. حسابك الآن يظهر للأهالي في نتائج البحث.</p>
          </div>
        </div>
      ) : isPending ? (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 rounded-xl border border-yellow-100 dark:border-yellow-900">
          <Loader2 className="h-5 w-5 flex-shrink-0 mt-0.5 animate-spin" />
          <div className="text-xs space-y-1">
            <span className="font-bold block">قيد المراجعة</span>
            <p>تم استلام وثائقك وهي قيد المراجعة حالياً من قبل الإدارة. سيتم إشعارك فور اكتمال التوثيق.</p>
          </div>
        </div>
      ) : isRejected ? (
        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold block">طلب التوثيق مرفوض</span>
            <p>
              تم رفض طلبك للسبب التالي:{' '}
              <strong className="text-foreground">{initialData.rejectionReason}</strong>. يرجى رفع
              وثائق صحيحة وإعادة التقديم.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl border border-border">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold block">غير موثق بعد</span>
            <p>يرجى رفع الوثائق المطلوبة أدناه للبدء في مراجعة ملفك الشخصي وتفعيل حسابك.</p>
          </div>
        </div>
      )}

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

      {/* Upload Wizards grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* National ID Upload */}
          <div className="border border-border rounded-xl p-5 text-center bg-accent/20 flex flex-col justify-between gap-3">
            <FileText className="h-8 w-8 text-primary mx-auto" />
            <div>
              <span className="text-xs font-bold block mb-1">الهوية الوطنية / جواز السفر *</span>
              <p className="text-[10px] text-muted-foreground">صورة واضحة لبطاقة الهوية الشخصية لتأكيد الاسم والمواطنة.</p>
            </div>
            <div className="space-y-2">
              <input
                type="file"
                id="id-doc"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'id')}
                className="hidden"
                disabled={isFieldsDisabled}
              />
              <label
                htmlFor={isFieldsDisabled ? undefined : 'id-doc'}
                className={`inline-block w-full bg-card border border-border text-xs font-semibold py-2 rounded-lg shadow-sm transition-colors ${
                  isFieldsDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-accent cursor-pointer'
                }`}
              >
                {uploadingField === 'id' ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : formData.nationalIdUrl ? (
                  'تم رفع الهوية ✓'
                ) : (
                  'رفع الهوية'
                )}
              </label>
              {formData.nationalIdUrl && (
                <a
                  href={formData.nationalIdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 w-full text-[11px] text-primary hover:underline font-semibold"
                >
                  <Eye className="h-3.5 w-3.5" />
                  معاينة الهوية المرفوعة
                </a>
              )}
            </div>
          </div>

          {/* Degree Upload */}
          <div className="border border-border rounded-xl p-5 text-center bg-accent/20 flex flex-col justify-between gap-3">
            <FileText className="h-8 w-8 text-primary mx-auto" />
            <div>
              <span className="text-xs font-bold block mb-1">الشهادة الجامعية / التخصص *</span>
              <p className="text-[10px] text-muted-foreground">شهادة التخرج أو ما يثبت تخصصك الأكاديمي والتعليمي.</p>
            </div>
            <div className="space-y-2">
              <input
                type="file"
                id="degree-doc"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, 'degree')}
                className="hidden"
                disabled={isFieldsDisabled}
              />
              <label
                htmlFor={isFieldsDisabled ? undefined : 'degree-doc'}
                className={`inline-block w-full bg-card border border-border text-xs font-semibold py-2 rounded-lg shadow-sm transition-colors ${
                  isFieldsDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-accent cursor-pointer'
                }`}
              >
                {uploadingField === 'degree' ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : formData.degreeUrl ? (
                  'تم رفع الشهادة ✓'
                ) : (
                  'رفع الشهادة'
                )}
              </label>
              {formData.degreeUrl && (
                <a
                  href={formData.degreeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 w-full text-[11px] text-primary hover:underline font-semibold"
                >
                  <Eye className="h-3.5 w-3.5" />
                  معاينة الشهادة المرفوعة
                </a>
              )}
            </div>
          </div>

          {/* Video Interview Upload */}
          <div className="border border-border rounded-xl p-5 text-center bg-accent/20 flex flex-col justify-between gap-3">
            <UploadCloud className="h-8 w-8 text-primary mx-auto" />
            <div>
              <span className="text-xs font-bold block mb-1">مقطع فيديو تعريفي (اختياري)</span>
              <p className="text-[10px] text-muted-foreground">مقطع فيديو دقيقة واحدة تشرح فيها طريقتك في التدريس لزيادة القبول.</p>
            </div>
            <div className="space-y-2">
              <input
                type="file"
                id="video-doc"
                accept="video/*"
                onChange={(e) => handleFileUpload(e, 'video')}
                className="hidden"
                disabled={isFieldsDisabled}
              />
              <label
                htmlFor={isFieldsDisabled ? undefined : 'video-doc'}
                className={`inline-block w-full bg-card border border-border text-xs font-semibold py-2 rounded-lg shadow-sm transition-colors ${
                  isFieldsDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-accent cursor-pointer'
                }`}
              >
                {uploadingField === 'video' ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : formData.videoInterviewUrl ? (
                  'تم رفع الفيديو ✓'
                ) : (
                  'رفع الفيديو'
                )}
              </label>
              {formData.videoInterviewUrl && (
                <a
                  href={formData.videoInterviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 w-full text-[11px] text-primary hover:underline font-semibold"
                >
                  <Eye className="h-3.5 w-3.5" />
                  معاينة الفيديو المرفوع
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        {!isFieldsDisabled && (
          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              disabled={loading || uploadingField !== null}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold px-6 py-2.5 rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ والتقديم...' : 'تقديم الأوراق للمراجعة'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
