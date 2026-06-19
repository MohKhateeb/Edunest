'use client';

import { useState } from 'react';
import Image from 'next/image';
import { updateTeacherProfile } from '@/lib/actions/teacher';
import { teacherProfileSchema } from '@/lib/validations/teacher';
import { Save, Loader2, Upload, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ProfileData = {
  specialization: string;
  subSpecialization: string | null;
  bio: string | null;
  gradeLevels: number[];
  city: string | null;
  area: string | null;
  education: string | null;
  yearsOfExperience: number;
  defaultHourlyRate: number;
  profileImageUrl: string | null;
};

type TeacherProfileFormProps = {
  initialData: ProfileData;
};

export default function TeacherProfileForm({ initialData }: TeacherProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const availableGrades = Array.from({ length: 12 }).map((_, i) => i + 1);

  const handleGradeToggle = (grade: number) => {
    const current = formData.gradeLevels;
    const updated = current.includes(grade)
      ? current.filter((g) => g !== grade)
      : [...current, grade].sort((a, b) => a - b);
    setFormData({ ...formData, gradeLevels: updated });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    const data = new FormData();
    data.append('file', file);
    data.append('bucket', 'profiles');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const resData = await res.json();
      setUploadingImage(false);

      if (res.ok && resData.url) {
        setFormData({ ...formData, profileImageUrl: resData.url });
        toast.success('تم رفع الصورة بنجاح');
      } else {
        toast.error('فشل رفع الصورة الشخصية', { description: resData.error });
      }
    } catch (err) {
      toast.error('حدث خطأ', { description: 'تعذر الاتصال بالخادم لرفع الصورة' });
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const validated = teacherProfileSchema.safeParse(formData);
    if (!validated.success) {
      toast.error('بيانات غير مكتملة', { description: 'الرجاء التأكد من تعبئة جميع الحقول المطلوبة بشكل صحيح.' });
      setLoading(false);
      return;
    }

    const res = await updateTeacherProfile({
      specialization: formData.specialization,
      subSpecialization: formData.subSpecialization || undefined,
      bio: formData.bio || undefined,
      gradeLevels: formData.gradeLevels,
      city: formData.city || '',
      area: formData.area || undefined,
      education: formData.education || undefined,
      yearsOfExperience: Number(formData.yearsOfExperience),
      defaultHourlyRate: Number(formData.defaultHourlyRate),
      profileImageUrl: formData.profileImageUrl || undefined,
    });

    setLoading(false);

    if (res.success) {
      toast.success('تم الحفظ بنجاح', { description: 'تم تحديث بيانات الملف الشخصي الخاص بك.' });
      router.refresh();
    } else {
      toast.error('خطأ', { description: res.error });
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Stepper Header */}
      <div className="bg-muted/30 border-b border-border px-8 py-6">
        <h2 className="font-extrabold text-xl mb-6">إعداد الملف الشخصي</h2>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 start-0 end-0 h-0.5 bg-border -z-10 -translate-y-1/2" />
          {[1, 2, 3].map((step) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <div key={step} className="flex flex-col items-center gap-2 bg-muted/30 px-2 relative z-10">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                    isActive ? "bg-primary border-primary text-primary-foreground" :
                    isCompleted ? "bg-primary/20 border-primary text-primary" :
                    "bg-card border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step}
                </div>
                <span className={cn(
                  "text-xs font-semibold",
                  isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step === 1 ? 'المعلومات الشخصية' : step === 2 ? 'التخصص والخبرات' : 'الأسعار والنبذة'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        <div className="min-h-[300px]">
          {/* STEP 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-6 flex-wrap mb-6">
                <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-accent border border-border flex-shrink-0">
                  {formData.profileImageUrl ? (
                    <Image
                      src={formData.profileImageUrl}
                      alt="Avatar Preview"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-3xl font-bold bg-primary/10">
                      ?
                    </div>
                  )}
                </div>
                <div>
                  <input type="file" id="avatar" accept="image/*" onChange={handleUploadImage} className="hidden" />
                  <label
                    htmlFor="avatar"
                    className="bg-card border border-border hover:bg-accent text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    {uploadingImage ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري الرفع...</>
                    ) : (
                      <><Upload className="h-3.5 w-3.5" /> اختيار الصورة الشخصية</>
                    )}
                  </label>
                  <span className="text-[10px] text-muted-foreground block mt-1">تنسيق JPG أو PNG، بحد أقصى 2 ميجابايت</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">المدينة *</label>
                  <input
                    type="text"
                    required
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
                    placeholder="رام الله، نابلس، الخليل"
                    className="w-full premium-input text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">المنطقة / الحي (اختياري)</label>
                  <input
                    type="text"
                    value={formData.area || ''}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value || null })}
                    placeholder="مثال: البالوع، الطيرة، رفيديا"
                    className="w-full premium-input text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Experience & Specialization */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">التخصص الأساسي *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="مثال: رياضيات، فيزياء، لغة إنجليزية"
                    className="w-full premium-input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">التخصص الفرعي (اختياري)</label>
                  <input
                    type="text"
                    value={formData.subSpecialization || ''}
                    onChange={(e) => setFormData({ ...formData, subSpecialization: e.target.value || null })}
                    placeholder="مثال: الجبر والهندسة، التوجيهي العلمي"
                    className="w-full premium-input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">التعليم والمؤهلات الأكاديمية</label>
                  <input
                    type="text"
                    value={formData.education || ''}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value || null })}
                    placeholder="مثال: بكالوريوس في الرياضيات - جامعة بيرزيت"
                    className="w-full premium-input text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">سنوات الخبرة *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
                    className="w-full premium-input text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">المراحل والصفوف الدراسية التي تدرسها *</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableGrades.map((grade) => {
                    const isSelected = formData.gradeLevels.includes(grade);
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => handleGradeToggle(grade)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground"
                        )}
                      >
                        الصف {grade}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Bio */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-semibold text-muted-foreground block">سعر الساعة الافتراضي (شيكل) *</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₪</span>
                  <input
                    type="number"
                    required
                    min={5}
                    value={formData.defaultHourlyRate}
                    onChange={(e) => setFormData({ ...formData, defaultHourlyRate: Number(e.target.value) })}
                    className="w-full premium-input text-sm ps-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">النبذة التعريفية (السيرة الشخصية)</label>
                <textarea
                  rows={5}
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value || null })}
                  placeholder="اكتب تفاصيل إضافية عن أسلوبك في التدريس والمواد التي تشرحها لتشجيع أولياء الأمور على اختيارك..."
                  className="w-full text-sm premium-input resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || loading || uploadingImage}
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-0 hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploadingImage}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-4.5 w-4.5 animate-spin" /> حفظ وإكمال...</>
              ) : (
                <><Save className="h-4.5 w-4.5" /> حفظ البيانات</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
