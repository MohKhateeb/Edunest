'use client';

import { useState } from 'react';
import { verifyTeacher, rejectTeacher } from '@/lib/actions/admin';
import { Star, Loader2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VerificationLevel } from '@prisma/client';
import { VERIFICATION_BADGE } from '@/lib/translations';
import DetailsModal from '@/components/shared/DetailsModal';
import DataTable from '@/components/shared/DataTable';

type TeacherRow = {
  id: string;
  specialization: string;
  isVerified: boolean;
  verificationLevel: VerificationLevel;
  averageRating: number;
  totalReviews: number;
  profileImageUrl: string | null;
  user: {
    name: string;
    email: string;
  };
};

type AdminTeachersListProps = {
  teachers: TeacherRow[];
};

export default function AdminTeachersList({ teachers }: AdminTeachersListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const handleLevelChange = async (teacherId: string, level: VerificationLevel) => {
    setLoadingId(teacherId);
    if (level === VerificationLevel.NONE) {
      await rejectTeacher(teacherId, 'تم إلغاء التوثيق من المدير العام');
    } else {
      await verifyTeacher(teacherId, level);
    }
    setLoadingId(null);
    router.refresh();
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'ALL' || t.verificationLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-4">
      <DataTable
        data={filteredTeachers}
        headers={[
          'اسم المعلم / التخصص',
          'البريد الإلكتروني',
          'التقييم',
          'حالة التوثيق',
          'تعديل مستوى التوثيق'
        ]}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="ابحث بالاسم أو البريد..."
        toolbarChildren={
          <select 
            className="premium-input text-sm sm:w-48 cursor-pointer"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="ALL">كل المستويات</option>
            <option value={VerificationLevel.NONE}>غير موثق</option>
            <option value={VerificationLevel.BRONZE}>برونزي</option>
            <option value={VerificationLevel.SILVER}>فضي</option>
            <option value={VerificationLevel.GOLD}>ذهبي</option>
          </select>
        }
        emptyMessage="لا توجد نتائج مطابقة للبحث."
        renderRow={(t) => {
          const badge = VERIFICATION_BADGE[t.verificationLevel];
          const badgeColors: Record<string, string> = {
            gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
            slate: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
            yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
          };
          const badgeClass = badgeColors[badge.color] || badgeColors.gray;

          return (
            <tr key={t.id} className="border-b border-border last:border-none hover:bg-accent/20">
              <td className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 rounded-full overflow-hidden bg-accent border border-border flex-shrink-0">
                      {t.profileImageUrl ? (
                        <img
                          src={t.profileImageUrl}
                          alt={t.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-primary font-bold text-sm bg-primary/10">
                          {t.user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold block text-foreground/80">{t.user.name}</span>
                      <span className="text-[10px] text-primary">{t.specialization}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTeacherId(t.id)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                    title="عرض الملف التعريفي الكامل"
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </button>
                </div>
              </td>
              <td className="p-4 text-muted-foreground">{t.user.email}</td>
              <td className="p-4">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500 fill-currentColor" />
                  <span className="font-semibold">{Number(t.averageRating).toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground">({t.totalReviews})</span>
                </div>
              </td>
              <td className="p-4">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                  {badge.label}
                </span>
              </td>
              <td className="p-4 text-left">
                {loadingId === t.id ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin ml-auto" />
                ) : (
                  <select
                    value={t.verificationLevel}
                    onChange={(e) => handleLevelChange(t.id, e.target.value as VerificationLevel)}
                    className="premium-input text-xs w-36 cursor-pointer"
                  >
                    <option value={VerificationLevel.NONE}>غير موثق (NONE)</option>
                    <option value={VerificationLevel.BRONZE}>برونزي (BRONZE)</option>
                    <option value={VerificationLevel.SILVER}>فضي (SILVER)</option>
                    <option value={VerificationLevel.GOLD}>ذهبي (GOLD)</option>
                  </select>
                )}
              </td>
            </tr>
          );
        }}
      />
      <DetailsModal 
        isOpen={!!selectedTeacherId} 
        onClose={() => setSelectedTeacherId(null)} 
        entityType="teacher" 
        entityId={selectedTeacherId} 
      />
    </div>
  );
}
