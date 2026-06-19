import Link from 'next/link';
import Image from 'next/image';
import StarRating from './StarRating';
import { MapPin, BadgeCheck } from 'lucide-react';
import { VERIFICATION_BADGE } from '@/lib/translations';
import { formatPrice } from '@/lib/utils';
import type { Teacher, User } from '@prisma/client';

type TeacherCardProps = {
  teacher: Teacher & {
    user: Pick<User, 'name'>;
  };
};

export default function TeacherCard({ teacher }: TeacherCardProps) {
  const badge = VERIFICATION_BADGE[teacher.verificationLevel];

  // Helper colors for badges
  const badgeColors: Record<string, string> = {
    gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    slate: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
  };

  const badgeColorClass = badgeColors[badge.color] || badgeColors.gray;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover-card flex flex-col h-full shadow-sm">
      {/* Profile Header */}
      <div className="p-6 flex items-start gap-4">
        {/* Avatar */}
        <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-accent border border-border flex-shrink-0">
          {teacher.profileImageUrl ? (
            <Image
              src={teacher.profileImageUrl}
              alt={teacher.user.name}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-primary font-bold text-xl bg-primary/10">
              {teacher.user.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg text-foreground truncate">{teacher.user.name}</h3>
            {teacher.isVerified && (
              <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColorClass}`}>
              {badge.label}
            </span>
          </div>

          <p className="text-sm text-primary font-medium mt-1">{teacher.specialization}</p>

          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={Number(teacher.averageRating)} size={14} />
            <span className="text-xs text-muted-foreground">({teacher.totalReviews} تقييم)</span>
          </div>
        </div>
      </div>

      {/* Bio Summary */}
      <div className="px-6 pb-4 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {teacher.bio || 'لا يوجد نبذة تعريفية متوفرة حالياً لهذا المعلم.'}
        </p>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-between items-center text-sm gap-2">
        <div className="flex items-center gap-1 text-muted-foreground truncate">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{teacher.city || 'غير محدد'}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs text-muted-foreground block">سعر الساعة</span>
          <span className="font-extrabold text-primary text-base">
            {teacher.defaultHourlyRate ? formatPrice(Number(teacher.defaultHourlyRate)) : 'غير محدد'}
          </span>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 bg-muted/30">
        <Link
          href={`/teachers/${teacher.slug}`}
          className="block w-full text-center text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          عرض الملف الشخصي والحجز
        </Link>
      </div>
    </div>
  );
}
