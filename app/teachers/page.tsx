import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'ابحث عن معلم | إيدونِست',
  description: 'تصفح قائمة المعلمين الموثّقين في الضفة الغربية وابحث بحسب التخصص والمدينة.',
};

interface SearchParams {
  subject?: string;
  city?: string;
  page?: string;
}

async function getTeachers(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const PAGE_SIZE = 12;

  const where: Record<string, any> = { 
    isVerified: true,
    user: { isActive: true }
  };
  if (params.subject) where.specialization = { contains: params.subject, mode: 'insensitive' };
  if (params.city) where.city = { contains: params.city, mode: 'insensitive' };

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      select: {
        id: true,
        slug: true,
        specialization: true,
        subSpecialization: true,
        city: true,
        area: true,
        averageRating: true,
        totalReviews: true,
        totalSessions: true,
        profileImageUrl: true,
        verificationLevel: true,
        yearsOfExperience: true,
        gradeLevels: true,
        user: { select: { name: true } },
        services: {
          where: { isActive: true },
          select: { price: true },
          orderBy: { price: 'asc' },
          take: 1,
        },
      },
      orderBy: [{ averageRating: 'desc' }, { totalSessions: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.teacher.count({ where }),
  ]);

  return { teachers, total, page, PAGE_SIZE };
}

const CITIES = ['رام الله', 'الخليل', 'نابلس', 'القدس', 'بيت لحم', 'طولكرم', 'قلقيلية', 'جنين', 'أريحا'];
const GRADE_LABELS: Record<number, string> = {
  1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس',
  6: 'السادس', 7: 'السابع', 8: 'الثامن', 9: 'التاسع', 10: 'العاشر',
  11: 'الحادي عشر', 12: 'الثاني عشر',
};

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { teachers, total, page, PAGE_SIZE } = await getTeachers(params);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const qp = new URLSearchParams();
    const merged = { subject: params.subject, city: params.city, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== '1') qp.set(k, v);
    }
    const str = qp.toString();
    return `/teachers${str ? `?${str}` : ''}`;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ─── Search Header ────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[hsl(172,66%,10%)] via-[hsl(172,60%,18%)] to-[hsl(200,50%,14%)] text-white py-14">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-extrabold mb-4">ابحث عن معلمك المثالي</h1>
          <p className="text-white/70 mb-8">
            {total > 0
              ? `${total} معلم موثّق في انتظارك`
              : 'لم يتم العثور على معلمين بهذه المعايير'}
          </p>

          {/* Search form */}
          <form
            id="teachers-search-form"
            method="get"
            action="/teachers"
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <input
              name="subject"
              id="search-subject"
              defaultValue={params.subject}
              placeholder="التخصص (رياضيات، فيزياء...)"
              className="flex-1 rounded-xl px-4 py-3 text-foreground bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <select
              name="city"
              id="search-city"
              defaultValue={params.city}
              className="rounded-xl px-4 py-3 text-foreground bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">جميع المدن</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              id="search-submit-btn"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl px-6 py-3 text-sm transition-colors"
            >
              بحث
            </button>
          </form>

          {/* Active filters */}
          {(params.subject || params.city) && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {params.subject && (
                <span className="bg-white/15 border border-white/25 rounded-full px-3 py-1 text-xs flex items-center gap-2">
                  {params.subject}
                  <Link href={buildUrl({ subject: undefined, page: '1' })} className="hover:text-red-300">✕</Link>
                </span>
              )}
              {params.city && (
                <span className="bg-white/15 border border-white/25 rounded-full px-3 py-1 text-xs flex items-center gap-2">
                  {params.city}
                  <Link href={buildUrl({ city: undefined, page: '1' })} className="hover:text-red-300">✕</Link>
                </span>
              )}
              <Link href="/teachers" className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-full px-3 py-1 text-xs text-red-200">
                مسح الكل
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Results Grid ─────────────────────────────────────── */}
      <section className="flex-1 py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          {teachers.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold mb-2">لم يتم العثور على معلمين</h2>
              <p className="text-muted-foreground mb-6">حاول تغيير معايير البحث أو تصفح جميع المعلمين.</p>
              <Link
                href="/teachers"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
              >
                عرض جميع المعلمين
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {teachers.map((t) => {
                const minPrice = t.services[0] ? Number(t.services[0].price) : null;
                return (
                  <Link
                    key={t.id}
                    href={`/teachers/${t.slug}`}
                    id={`teacher-card-${t.id}`}
                    className="hover-card glow-effect group bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
                  >
                    {/* Avatar */}
                    <div className="relative h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
                      {t.profileImageUrl ? (
                        <Image
                          src={t.profileImageUrl}
                          alt={t.user.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary border-4 border-white shadow-md">
                          {t.user.name.charAt(0)}
                        </div>
                      )}
                      {t.verificationLevel !== 'NONE' && (
                        <span className="absolute top-2 start-2 text-xs bg-white/90 dark:bg-card/90 rounded-full px-2 py-0.5 font-bold shadow-sm">
                          {t.verificationLevel === 'GOLD' ? '🥇' : t.verificationLevel === 'SILVER' ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <h2 className="font-bold text-sm group-hover:text-primary transition-colors mb-0.5 truncate">
                        {t.user.name}
                      </h2>
                      <p className="text-xs text-muted-foreground mb-1 truncate">
                        {t.specialization}
                        {t.subSpecialization ? ` · ${t.subSpecialization}` : ''}
                      </p>
                      {t.city && (
                        <p className="text-xs text-muted-foreground mb-2">
                          📍 {t.city}{t.area ? ` - ${t.area}` : ''}
                        </p>
                      )}
                      {t.gradeLevels.length > 0 && (
                        <p className="text-xs text-muted-foreground mb-3">
                          الصفوف: {t.gradeLevels.slice(0, 3).map((g) => GRADE_LABELS[g] ?? g).join('، ')}
                          {t.gradeLevels.length > 3 && ' ...'}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between text-xs border-t border-border pt-3">
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          ★ {Number(t.averageRating).toFixed(1)}
                          <span className="text-muted-foreground font-normal">({t.totalReviews})</span>
                        </span>
                        {minPrice !== null && (
                          <span className="font-bold text-primary">
                            من {minPrice} ₪
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  السابق →
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                .map((p, i, arr) => {
                  const prev = arr[i - 1];
                  return (
                    <>
                      {prev && p - prev > 1 && (
                        <span key={`ellipsis-${p}`} className="px-2 text-muted-foreground">...</span>
                      )}
                      <Link
                        key={p}
                        href={buildUrl({ page: String(p) })}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                          p === page
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        {p}
                      </Link>
                    </>
                  );
                })}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  ← التالي
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
