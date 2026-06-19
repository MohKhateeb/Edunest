'use client';

import { useState } from 'react';
import type { Student } from '@prisma/client';
import { GraduationCap, MapPin, Eye, Edit3, AlertCircle, X, Loader2 } from 'lucide-react';
import DetailsModal from '@/components/shared/DetailsModal';
import { updateStudent } from '@/lib/actions/user';
import { toast } from 'sonner';
import Portal from './Portal';
import NajeebCharacter from '@/components/shared/NajeebCharacter';

interface ParentStudentsListProps {
  students: (Student & {
    _count?: {
      bookings: number;
    };
  })[];
}

export default function ParentStudentsList({ students }: ParentStudentsListProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Edit States
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('1');
  const [editSchool, setEditSchool] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditGrade(String(student.grade));
    setEditSchool(student.school || '');
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditLoading(true);
    setEditError(null);

    const res = await updateStudent(editingStudent.id, {
      name: editName,
      grade: Number(editGrade),
      school: editSchool || undefined,
    });

    setEditLoading(false);
    if (res.success) {
      toast.success('تم تحديث بيانات الطالب بنجاح');
      setEditingStudent(null);
    } else {
      setEditError(res.error);
    }
  };

  return (
    <>
      {/* التنويه حول تعديل البيانات */}
      <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/40 rounded-2xl text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5 shadow-premium leading-relaxed">
        <AlertCircle className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-extrabold block mb-1">💡 تنويه هام بخصوص تعديل البيانات:</span>
          تعديل معلومات الطالب (الاسم، الصف، المدرسة) متاح بالكامل طالما **لم يتم حجز أي جلسة تعليمية** له بعد. بمجرد جدولة أول جلسة، سيتم إغلاق التعديل تلقائياً لحفظ نزاهة تقارير وسجلات الحصص.
        </div>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-accent/10 border border-border/50 rounded-3xl p-6 shadow-premium">
          <NajeebCharacter mode="study" size="md" animated={true} />
          <div>
            <p className="text-sm font-bold text-foreground">لم تقم بإضافة أي طالب لحسابك بعد</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              استخدم النموذج الجانبي لإضافة طالبك الأول للبدء بجدولة الحصص الدراسية.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {students.map((student) => {
            const hasBookings = (student._count?.bookings ?? 0) > 0;

            return (
              <div
                key={student.id}
                className="p-5 border border-border/80 rounded-3xl bg-card hover-card relative overflow-hidden flex flex-col justify-between gap-4 min-h-[150px] shadow-premium"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                      <GraduationCap className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{student.name}</h3>
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
                        الصف الدراسي {student.grade}
                      </span>
                    </div>
                  </div>

                  {student.school && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <span>المدرسة: {student.school}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/40 pt-3.5 flex justify-between gap-2">
                  <button
                    onClick={() => setSelectedStudentId(student.id)}
                    className="text-[11px] font-bold text-muted-foreground hover:text-foreground border border-border hover:bg-accent/40 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    التفاصيل والسجل
                  </button>

                  {hasBookings ? (
                    <button
                      disabled
                      className="text-[11px] font-bold text-muted-foreground/50 bg-muted/30 border border-border px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-not-allowed opacity-60"
                      title="تم قفل التعديل لوجود جلسات مسجلة لهذا الطالب"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      التعديل مقفل
                    </button>
                  ) : (
                    <button
                      onClick={() => openEditModal(student)}
                      className="text-[11px] font-bold text-teal-600 hover:text-white border border-teal-600/20 hover:bg-teal-600 hover:border-teal-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      تعديل البيانات
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال تعديل بيانات الطالب */}
      {editingStudent && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
            <form onSubmit={handleEditSubmit} className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl my-8 text-right" dir="rtl">
              <div className="flex justify-between items-center border-b border-border pb-2.5">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-primary" />
                  تعديل بيانات الطالب: {editingStudent.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editError && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">اسم الطالب *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full premium-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">الصف الدراسي *</label>
                <select
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  className="w-full premium-input text-xs"
                >
                  {Array.from({ length: 12 }).map((_, index) => {
                    const classNum = index + 1;
                    return (
                      <option key={classNum} value={classNum}>
                        الصف {classNum}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">المدرسة (اختياري)</label>
                <input
                  type="text"
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  className="w-full premium-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="text-xs font-semibold border border-border hover:bg-accent px-4 py-2 rounded-lg cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ التغييرات'
                  )}
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      <DetailsModal 
        isOpen={!!selectedStudentId} 
        onClose={() => setSelectedStudentId(null)} 
        entityType="student" 
        entityId={selectedStudentId} 
      />
    </>
  );
}
