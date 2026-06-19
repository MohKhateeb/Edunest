import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { prisma } from '@/lib/prisma';
import AvailabilityViewer from '@/components/shared/AvailabilityViewer';
import StarRating from '@/components/shared/StarRating';
import type { Metadata } from 'next';

const GRADE_LABELS: Record<number, string> = {
  1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس',
  6: 'السادس', 7: 'السابع', 8: 'الثامن', 9: 'التاسع', 10: 'العاشر',
  11: 'الحادي عشر', 12: 'الثاني عشر',
};

const VERIFICATION_LABELS: Record<string, string> = {
  BRONZE: '🥉 برونزي',
  SILVER: '🥈 فضي',
  GOLD: '🥇 ذهبي',
};

async function getTeacher(slug: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true, email: true, isActive: true } },
      services: {
        where: { isActive: true },
        include: { serviceType: { select: { name: true, defaultDuration: true } } },
        orderBy: { price: 'asc' },
      },
      availability: {
        where: { isActive: true },
        orderBy: { dayOfWeek: 'asc' },
      },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          booking: {
            select: {
              parent: { select: { name: true } },
              student: { select: { name: true, grade: true } },
            },
          },
        },
      },
    },
  });

  if (!teacher || !teacher.user.isActive) notFound();
  return teacher;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { slug },
    select: {
      specialization: true,
      bio: true,
      city: true,
      user: { select: { name: true, isActive: true } },
    },
  });

  if (!teacher || !teacher.user.isActive) {
    return { title: 'معلم غير موجود | إيدونِست' };
  }

  return {
    title: `${teacher.user.name} - معلم ${teacher.specialization} | إيدونِست`,
    description: teacher.bio
      ? teacher.bio.slice(0, 155)
      : `معلم ${teacher.specialization} موثّق في ${teacher.city ?? 'الضفة الغربية'}. احجز جلستك التجريبية المجانية الآن.`,
  };
}

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const teacher = await getTeacher(slug);
  const session = await auth();

  const isLoggedInParent = session?.user.userType === 'PARENT';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ─── Hero Banner ──────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[hsl(172,66%,10%)] via-[hsl(172,60%,18%)] to-[hsl(200,50%,14%)] text-white py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {teacher.profileImageUrl ? (
              <Image
                src={teacher.profileImageUrl}
                alt={teacher.user.name}
                width={112}
                height={112}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-white/30 shadow-2xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-white/10 border-4 border-white/30 shadow-2xl flex items-center justify-center text-5xl font-extrabold text-white/70">
                {teacher.user.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-right">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1 justify-center sm:justify-start">
              <h1 className="text-3xl font-extrabold">{teacher.user.name}</h1>
              {teacher.verificationLevel !== 'NONE' && (
                <span className="inline-flex items-center bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-full px-3 py-0.5 text-xs font-bold">
                  {VERIFICATION_LABELS[teacher.verificationLevel]}
                </span>
              )}
            </div>
            <p className="text-white/70 text-lg mb-3">
              {teacher.specialization}
              {teacher.subSpecialization ? ` · ${teacher.subSpecialization}` : ''}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/60">
              {teacher.city && <span>📍 {teacher.city}{teacher.area ? ` - ${teacher.area}` : ''}</span>}
              {teacher.yearsOfExperience > 0 && <span>🎓 {teacher.yearsOfExperience} سنة خبرة</span>}
              <span className="flex items-center gap-1 text-amber-400">
                ★ {Number(teacher.averageRating).toFixed(1)}
                <span className="text-white/50">({teacher.totalReviews} تقييم)</span>
              </span>
              <span>📚 {teacher.totalSessions} جلسة مكتملة</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0">
            {isLoggedInParent ? (
              <Link
                href={`/dashboard/parent/bookings/new?teacherSlug=${teacher.slug}`}
                id="book-session-btn"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl px-6 py-3 text-base transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5"
              >
                📅 احجز جلسة
              </Link>
            ) : (
              <Link
                href={`/login?callbackUrl=/teachers/${teacher.slug}`}
                id="book-session-login-btn"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-2xl px-6 py-3 text-base transition-all duration-200 backdrop-blur-sm"
              >
                🔑 سجّل دخولك للحجز
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Content ──────────────────────────────────────────── */}
      <div className="flex-1 bg-muted/20 py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Bio */}
            {teacher.bio && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-3">نبذة عن المعلم</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{teacher.bio}</p>
              </div>
            )}

            {/* Services */}
            {teacher.services.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">الخدمات والأسعار</h2>
                <div className="space-y-3">
                  {teacher.services.map((svc) => (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-accent/30 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm">{svc.serviceType.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {svc.duration} دقيقة
                          {svc.customDescription && ` · ${svc.customDescription}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-base">{Number(svc.price)} ₪</p>
                        <p className="text-xs text-muted-foreground">للجلسة</p>
                      </div>
                    </div>
                  ))}
                </div>

                {isLoggedInParent ? (
                  <Link
                    href={`/dashboard/parent/bookings/new?teacherSlug=${teacher.slug}`}
                    id="book-now-bottom-btn"
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity"
                  >
                    📅 احجز الآن
                  </Link>
                ) : (
                  <Link
                    href={`/login?callbackUrl=/teachers/${teacher.slug}`}
                    id="login-to-book-btn"
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity"
                  >
                    🔑 سجّل دخولك للحجز
                  </Link>
                )}
              </div>
            )}

            {/* Reviews */}
            {teacher.reviews.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">
                  تقييمات الأهالي
                  <span className="text-sm font-normal text-muted-foreground me-2">({teacher.totalReviews})</span>
                </h2>
                <div className="space-y-4">
                  {teacher.reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-semibold text-sm">{review.booking.parent.name}</p>
                          <p className="text-xs text-muted-foreground">
                            للطالب {review.booking.student.name} — الصف {GRADE_LABELS[review.booking.student.grade] ?? review.booking.student.grade}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {new Date(review.createdAt).toLocaleDateString('ar-PS', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Quick Info */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-base font-bold">معلومات سريعة</h2>

              {teacher.education && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-xl">🎓</span>
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground">المؤهل العلمي</p>
                    <p>{teacher.education}</p>
                  </div>
                </div>
              )}

              {teacher.yearsOfExperience > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-xl">⏳</span>
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground">سنوات الخبرة</p>
                    <p>{teacher.yearsOfExperience} سنة</p>
                  </div>
                </div>
              )}

              {teacher.gradeLevels.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-xl">📚</span>
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground mb-1">الصفوف الدراسية</p>
                    <div className="flex flex-wrap gap-1">
                      {teacher.gradeLevels.map((g) => (
                        <span key={g} className="bg-accent text-accent-foreground rounded-lg px-2 py-0.5 text-xs">
                          {GRADE_LABELS[g] ?? `الصف ${g}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Availability */}
            {teacher.availability.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="text-base font-bold mb-4">أوقات التوفر الأسبوعية</h2>
                <AvailabilityViewer availability={teacher.availability} />
              </div>
            )}

            {/* Rating summary */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
              <div className="text-5xl font-extrabold text-primary mb-1">
                {Number(teacher.averageRating).toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                <StarRating rating={Math.round(Number(teacher.averageRating))} />
              </div>
              <p className="text-xs text-muted-foreground">
                بناءً على {teacher.totalReviews} تقييم حقيقي
              </p>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
