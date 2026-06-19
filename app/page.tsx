import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { prisma } from '@/lib/prisma';
import * as Lucide from 'lucide-react';
import AnimatedCounter from '@/components/shared/landing/AnimatedCounter';
import NajeebCharacter from '@/components/shared/NajeebCharacter';
import HakeemCharacter from '@/components/shared/HakeemCharacter';

export const metadata = {
  title: 'إيدونِست | المنصة التعليمية الفلسطينية الأولى',
  description:
    'ابحث عن معلم خصوصي موثوق لطفلك في الضفة الغربية. حجز فوري، دفع آمن، جلسة تجريبية مجانية.',
};

// أيقونة Lucide الديناميكية
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Lucide as any)[name];
  if (!IconComponent) {
    return <Lucide.HelpCircle className={className} />;
  }
  return <IconComponent className={className} />;
}

// جلب المعلمين المميزين
async function getFeaturedTeachers(limit = 6) {
  try {
    return await prisma.teacher.findMany({
      where: { 
        isVerified: true,
        user: { isActive: true }
      },
      select: {
        id: true,
        slug: true,
        specialization: true,
        city: true,
        averageRating: true,
        totalReviews: true,
        totalSessions: true,
        profileImageUrl: true,
        verificationLevel: true,
        user: { select: { name: true } },
      },
      orderBy: { averageRating: 'desc' },
      take: limit,
    });
  } catch {
    return [];
  }
}

// جلب الأسئلة الشائعة من قاعدة البيانات
async function getActiveFAQs() {
  try {
    return await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  } catch {
    return [];
  }
}

// الأقسام الافتراضية المنسقة مسبقاً بالتصميم الاحترافي
const DEFAULT_LAYOUT = [
  {
    id: 'hero',
    type: 'hero',
    enabled: true,
    props: {
      badgeText: 'جديد',
      badgeMessage: 'جلستك التجريبية الأولى مجانية تماماً 🎉',
      headline: 'ابحث عن معلمك المثالي في فلسطين',
      subheadline: 'منصة إيدونِست تربطك بمعلمين خصوصيين موثّقين لجميع المواد والمراحل الدراسية. حجز سهل، دفع آمن، ومتابعة مستمرة لتقدم طفلك.',
      primaryBtnText: 'ابحث عن معلم',
      primaryBtnLink: '/teachers',
      secondaryBtnText: 'سجّل كمعلم',
      secondaryBtnLink: '/register'
    }
  },
  {
    id: 'stats',
    type: 'stats',
    enabled: true,
    props: {
      items: [
        { label: 'معلم موثّق', value: 200, suffix: '+' },
        { label: 'جلسة ناجحة', value: 5000, suffix: '+' },
        { label: 'طالب مستفيد', value: 1200, suffix: '+' },
        { label: 'مدينة تغطيتها', value: 15, suffix: '+' }
      ]
    }
  },
  {
    id: 'subjects',
    type: 'subjects',
    enabled: true,
    props: {
      title: 'المواد الأكثر طلباً',
      subjects: [
        'رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'عربي', 'إنجليزي',
        'تاريخ', 'جغرافيا', 'دين', 'معلوماتية', 'اقتصاد', 'محاسبة'
      ]
    }
  },
  {
    id: 'features',
    type: 'features',
    enabled: true,
    props: {
      title: 'لماذا إيدونِست؟',
      subtitle: 'صممنا المنصة لتوفر تجربة تعليمية موثوقة وممتعة ومنظمة للأهل والطلاب على حد سواء.',
      items: [
        { iconName: 'ShieldCheck', title: 'معلمون موثّقون', desc: 'نتحقق من هوية كل معلم وشهاداته الأكاديمية قبل قبوله في المنصة.' },
        { iconName: 'CalendarCheck', title: 'حجز فوري وسهل', desc: 'اختر المعلم المناسب واحجز جلستك في دقائق معدودة دون أي تعقيد.' },
        { iconName: 'GraduationCap', title: 'جلسة تجريبية مجانية', desc: 'جرّب أول جلسة مجاناً مع كل معلم لتطمئن على أسلوبه قبل الالتزام.' },
        { iconName: 'CreditCard', title: 'دفع آمن ومحمي', desc: 'نقبل التحويل البنكي والدفع الإلكتروني مع ضمان استرداد المبلغ عند الإلغاء.' },
        { iconName: 'Star', title: 'تقييمات حقيقية', desc: 'اقرأ آراء الأهالي الحقيقية واختر المعلم الأعلى تقييماً في تخصصه.' },
        { iconName: 'FileText', title: 'تقارير الحصص', desc: 'يرسل لك المعلم تقريراً بعد كل حصة يشمل المواضيع والأداء والواجبات.' }
      ]
    }
  },
  {
    id: 'how_it_works',
    type: 'how_it_works',
    enabled: true,
    props: {
      title: 'كيف يعمل إيدونِست؟',
      subtitle: 'ثلاث خطوات بسيطة ويكون طفلك في أفضل أيدٍ أمينة',
      items: [
        { num: '١', title: 'ابحث عن معلم', desc: 'اكتب التخصص والمدينة واختر من قائمة المعلمين الموثّقين.' },
        { num: '٢', title: 'احجز جلستك', desc: 'اختر الوقت المناسب واحجز جلستك التجريبية المجانية فوراً.' },
        { num: '٣', title: 'تعلّم وتقدّم', desc: 'احضر حصتك واحصل على تقرير مفصّل بعد كل جلسة.' }
      ]
    }
  },
  {
    id: 'featured_teachers',
    type: 'featured_teachers',
    enabled: true,
    props: {
      title: 'معلمون مميزون',
      subtitle: 'الأعلى تقييماً من قِبل أولياء الأمور',
      limit: 6
    }
  },
  {
    id: 'testimonials',
    type: 'testimonials',
    enabled: true,
    props: {
      title: 'ماذا يقول أولياء الأمور؟',
      subtitle: 'تجارب حقيقية من عائلات استفادت من خدماتنا',
      items: [
        { text: 'أفضل منصة للبحث عن معلمين. ابني تحسن في الرياضيات بشكل ملحوظ بعد 3 حصص فقط!', author: 'أم أحمد', city: 'رام الله' },
        { text: 'سهولة في الحجز ومصداقية عالية. التقرير بعد كل جلسة يريحني جداً وأعرف أين وصل طفلي.', author: 'أبو يوسف', city: 'نابلس' },
        { text: 'الأساتذة هنا محترفون جداً. الجلسة التجريبية فكرة رائعة ساعدتنا في اختيار المعلم الأنسب.', author: 'أم سارة', city: 'الخليل' }
      ]
    }
  },
  {
    id: 'faq',
    type: 'faq',
    enabled: true,
    props: {
      title: 'الأسئلة الشائعة',
      subtitle: 'كل ما ترغب بمعرفته حول كيفية الحجز والتعامل مع المنصة'
    }
  },
  {
    id: 'cta',
    type: 'cta',
    enabled: true,
    props: {
      title: 'ابدأ رحلة طفلك التعليمية اليوم',
      subtitle: 'سجّل مجاناً، تصفح المعلمين، واحجز جلستك التجريبية دون أي التزام.',
      primaryBtnText: '🚀 سجّل الآن مجاناً',
      primaryBtnLink: '/register',
      secondaryBtnText: 'تصفح المعلمين',
      secondaryBtnLink: '/teachers'
    }
  }
];

export default async function HomePage() {
  // جلب البيانات من قاعدة البيانات
  const layoutSetting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'HomepageLayout' }
  });

  let layout = DEFAULT_LAYOUT;
  if (layoutSetting?.settingValue) {
    try {
      layout = JSON.parse(layoutSetting.settingValue);
    } catch {
      layout = DEFAULT_LAYOUT;
    }
  }

  // فرز الأقسام المفعّله فقط
  const enabledSections = layout.filter((s) => s.enabled);

  // إعداد دالات جلب إضافية حسب الأقسام
  const featuredTeachersLimit = layout.find(s => s.type === 'featured_teachers')?.props?.limit || 6;
  const featuredTeachers = await getFeaturedTeachers(featuredTeachersLimit);
  const faqs = await getActiveFAQs();

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-background">
      <Header />

      {enabledSections.map((section) => {
        const type = section.type;
        const props = section.props as any;

        switch (type) {
          // ─── البانر التعريفي الأول (Hero) ──────────────────────
          case 'hero':
            return (
              <section 
                key={section.id} 
                className="relative bg-gradient-to-br from-blue-50/70 via-white to-orange-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 text-foreground overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-border/50"
              >
                {/* خلفية تجميلية متوهجة */}
                <div aria-hidden className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full opacity-10 dark:opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
                  <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full opacity-5 dark:opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
                </div>
 
                <div className="max-w-6xl mx-auto px-4 z-10 animate-fade-in-up">
                  <div className="bg-white dark:bg-slate-900/90 border border-border rounded-[2.5rem] overflow-visible shadow-premium grid grid-cols-1 lg:grid-cols-12 gap-0" dir="rtl">
                    {/* Right Column: Hero Content */}
                    <div className="lg:col-span-7 p-8 md:p-12 lg:p-16 flex flex-col justify-center items-center lg:items-start text-center lg:text-right space-y-6">
                      {props.badgeMessage && (
                        <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-900/50 rounded-full px-5 py-2 text-xs shadow-sm">
                          {props.badgeText && (
                            <span suppressHydrationWarning className="bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] md:text-xs">
                              {props.badgeText}
                            </span>
                          )}
                          <span suppressHydrationWarning className="text-orange-900 dark:text-orange-300 font-semibold">{props.badgeMessage}</span>
                        </div>
                      )}

                      <h1 suppressHydrationWarning className="text-3xl md:text-5xl lg:text-6xl font-black leading-[1.2] tracking-tight text-slate-900 dark:text-white">
                        {props.headline?.split(' في ')[0]}
                        <br />
                        <span suppressHydrationWarning className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
                          {props.headline?.includes(' في ') ? `في ${props.headline?.split(' في ')[1]}` : ''}
                        </span>
                      </h1>

                      <p suppressHydrationWarning className="text-xs md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {props.subheadline}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
                        {props.primaryBtnText && (
                          <Link
                            suppressHydrationWarning
                            href={props.primaryBtnLink || '/teachers'}
                            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-2xl px-8 py-4 text-sm md:text-base transition-all duration-300 shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.35)] hover:-translate-y-1 cursor-pointer"
                          >
                            <Lucide.Search className="w-5 h-5" /> {props.primaryBtnText}
                          </Link>
                        )}
                        {props.secondaryBtnText && (
                          <Link
                            suppressHydrationWarning
                            href={props.secondaryBtnLink || '/register'}
                            className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white font-bold rounded-2xl px-8 py-4 text-sm md:text-base transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                          >
                            <Lucide.UserPlus className="w-5 h-5" /> {props.secondaryBtnText}
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Left Column: Visual container with Najeeb Peeking */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-orange-50/40 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 p-8 flex items-center justify-center relative border-t lg:border-t-0 lg:border-l border-border/50 min-h-[350px] lg:min-h-full overflow-visible group rounded-b-[2.5rem] lg:rounded-b-none lg:rounded-l-[2.5rem]">
                      
                      {/* Card Wrapper to group scheduling card, character and badge together */}
                      <div className="relative w-full max-w-sm mx-auto">
                        
                        {/* Najeeb peeking from behind the main info card */}
                        <div className="absolute -top-36 -left-28 lg:-left-32 z-0 pointer-events-none transition-transform duration-300 group-hover:-translate-y-2">
                          <NajeebCharacter mode="welcome" size="lg" animated={false} />
                        </div>

                        {/* Floating scheduling card */}
                        <div className="relative z-10 w-full bg-white dark:bg-slate-900 border border-border rounded-3xl p-6 shadow-premium transition-all duration-300 group-hover:shadow-2xl">
                          <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center font-bold">
                                📚
                              </div>
                              <div className="text-right">
                                <h4 suppressHydrationWarning className="text-xs font-black text-slate-900 dark:text-white">الحصة القادمة</h4>
                                <p suppressHydrationWarning className="text-[10px] text-muted-foreground font-semibold">اليوم، 4:00 م</p>
                              </div>
                            </div>
                            <span suppressHydrationWarning className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-black px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                              نشط
                            </span>
                          </div>

                          <div className="space-y-3.5">
                            <div className="flex justify-between items-center text-xs">
                              <span suppressHydrationWarning className="text-muted-foreground font-semibold">المعلم:</span>
                              <span suppressHydrationWarning className="font-bold text-slate-800 dark:text-slate-200">أ. أحمد كمال (رياضيات)</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span suppressHydrationWarning className="text-muted-foreground font-semibold">الرابط:</span>
                              <span suppressHydrationWarning className="text-primary font-bold hover:underline cursor-pointer">الجلسة مباشرة 🔗</span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="pt-2 border-t border-border/50">
                              <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold">
                                <span suppressHydrationWarning className="text-muted-foreground">نسبة الفهم والتقدم</span>
                                <span suppressHydrationWarning className="text-primary">92%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full" style={{ width: '92%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Small floating badge */}
                        <div className="absolute -bottom-6 -right-6 z-20 bg-slate-900 text-white rounded-2xl p-3 shadow-2xl flex items-center gap-2 border border-white/10 transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                          <div className="w-7 h-7 rounded-lg bg-yellow-400 text-slate-900 flex items-center justify-center font-bold text-xs">
                            🏆
                          </div>
                          <div className="text-right">
                            <p suppressHydrationWarning className="text-[9px] text-slate-400 font-bold leading-none">مستوى الطالب</p>
                            <h5 suppressHydrationWarning className="text-[11px] font-black leading-tight mt-0.5">ممتاز (المستوى 5)</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          // ─── شريط الإحصائيات (Stats Bar) ────────────────────────
          case 'stats':
            return (
              <section 
                key={section.id} 
                className="bg-white dark:bg-card border border-border shadow-premium relative z-20 -mt-10 mx-4 md:mx-auto max-w-5xl rounded-3xl animate-fade-in-up"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center py-8 px-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-border/50">
                  {(props.items || []).map((s: any, idx: number) => (
                    <div key={idx} className="space-y-1.5 pt-4 md:pt-0">
                      <p className="text-3xl md:text-4xl font-black text-primary flex items-center justify-center gap-1">
                        <AnimatedCounter from={0} to={s.value || 0} duration={2} />
                        <span className="text-xl font-bold">{s.suffix}</span>
                      </p>
                      <p className="text-xs md:text-sm font-semibold text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            );

          // ─── المواد الدراسية الأكثر طلباً ───────────────────────
          case 'subjects':
            const subjectEmojis: Record<string, string> = {
              'رياضيات': '🧮',
              'فيزياء': '⚡',
              'كيمياء': '🧪',
              'أحياء': '🧬',
              'عربي': '📝',
              'إنجليزي': '🇬🇧',
              'تاريخ': '📜',
              'جغرافيا': '🗺️',
              'دين': '🕌',
              'معلوماتية': '💻',
              'اقتصاد': '📈',
              'محاسبة': '📊'
            };
            return (
              <section key={section.id} className="bg-background pt-16 pb-8">
                <div className="max-w-6xl mx-auto px-6">
                  {props.title && (
                    <p className="text-center text-xs md:text-sm font-bold text-muted-foreground/80 mb-6 uppercase tracking-wider">
                      {props.title}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center gap-3">
                    {(props.subjects || []).map((subj: string) => (
                      <Link
                        key={subj}
                        href={`/teachers?subject=${encodeURIComponent(subj)}`}
                        className="rounded-full border border-border bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800 hover:from-primary/10 hover:to-primary/5 hover:border-primary/45 px-6 py-3 text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-base">{subjectEmojis[subj] || '📚'}</span>
                        <span>{subj}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );

          // ─── مميزات المنصة (Features) ───────────────────────────
          case 'features':
            return (
              <section key={section.id} className="py-24 bg-muted/20">
                <div className="max-w-6xl mx-auto px-6">
                  {(props.title || props.subtitle) && (
                    <div className="text-center mb-16">
                      {props.title && <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900 dark:text-white">{props.title}</h2>}
                      {props.subtitle && <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto font-medium">{props.subtitle}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-right" dir="rtl">
                    {/* بطاقة الحكيم التفاعلية الجانبية مع تأثير الجلوس */}
                    <div className="lg:col-span-4 relative mt-16 bg-white dark:bg-card border border-border/80 rounded-3xl p-6 pt-16 shadow-premium flex flex-col items-center text-center lg:sticky lg:top-36 transition-all duration-300 hover:shadow-xl group">
                      {/* الحكيم يجلس على حافة المكون */}
                      <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-20">
                        <HakeemCharacter size="lg" />
                      </div>
                      
                      <div className="space-y-3.5 relative z-10 w-full">
                        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full">
                          🦉 مستشارك الذكي - الحكيم
                        </span>
                        <div className="relative bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-border/50">
                          {/* سهم الفقاعة */}
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-50 dark:bg-slate-900/50 border-t border-l border-border/50 rotate-45"></div>
                          
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-bold relative z-10">
                            «مرحباً! لقد صممنا لك منصة إيدونِست بميزات متكاملة توفر الأمان والراحة والتحقق الكامل لتضمن لطفلك تجربة تعليمية ممتعة ومثمرة.»
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* شبكة المميزات */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(props.items || []).map((f: any, idx: number) => (
                        <div
                          key={idx}
                          className="hover-card bg-card border border-border/60 rounded-3xl p-6 space-y-3 shadow-premium hover:shadow-xl transition-all duration-300"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <DynamicIcon name={f.iconName || 'ShieldCheck'} className="w-6 h-6" />
                          </div>
                          <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white">{f.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );

          // ─── كيف يعمل الموقع (How It Works) ────────────────────
          case 'how_it_works':
            const questItems = props.items || [];
            return (
              <section key={section.id} className="py-24 bg-background overflow-hidden relative">
                {/* Najeeb Character next to the steps (facing/looking at the steps) */}
                <div className="hidden xl:block absolute left-[calc(50%-560px)] top-[28%] z-0 pointer-events-none">
                  <NajeebCharacter mode="help" size="lg" animated={true} />
                </div>

                {/* Hakeem Character next to the bottom steps */}
                <div className="hidden xl:block absolute right-[calc(50%-560px)] bottom-[10%] z-0 pointer-events-none">
                  <HakeemCharacter size="lg" className="animate-float" />
                </div>

                <div className="max-w-4xl mx-auto px-6">
                  {(props.title || props.subtitle) && (
                    <div className="text-center mb-16">
                      {props.title && <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground">{props.title}</h2>}
                      {props.subtitle && <p className="text-sm md:text-base text-muted-foreground font-medium">{props.subtitle}</p>}
                    </div>
                  )}

                  <div className="relative pb-16">
                    {/* Winding SVG Quest Path (Duolingo style) for medium and larger screens */}
                    <div aria-hidden className="hidden md:block absolute inset-0 pointer-events-none select-none">
                      <svg className="w-full h-full min-h-[450px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path 
                          d="M 550 80 C 350 80, 150 180, 150 260 C 150 340, 550 340, 550 420" 
                          stroke="url(#quest-path-gradient)" 
                          strokeWidth="6" 
                          strokeLinecap="round" 
                          strokeDasharray="12 12" 
                        />
                        <defs>
                          <linearGradient id="quest-path-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563eb" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#f97316" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Winding/Zig-zag Steps Container */}
                    <div className="relative z-10 flex flex-col gap-16 md:gap-24">
                      {questItems.map((step: any, idx: number) => {
                        // Zig zag arrangement on desktop: Step 1 (right), Step 2 (left), Step 3 (right)
                        // In RTL:
                        // idx = 0 (right): flex justify-end md:pl-24
                        // idx = 1 (left): flex justify-start md:pr-24
                        // idx = 2 (right): flex justify-end md:pl-24
                        const isEven = idx % 2 === 0;
                        const justifyClass = isEven ? 'md:justify-end md:pl-24' : 'md:justify-start md:pr-24';
                        const colorGradients = [
                          'from-primary to-blue-500',
                          'from-purple-500 to-indigo-600',
                          'from-orange-500 to-amber-600'
                        ];
                        const gradient = colorGradients[idx % colorGradients.length];

                        return (
                          <div key={idx} className={`flex justify-center ${justifyClass} group`}>
                            <div className="w-full md:w-[70%] bg-card border border-border/80 rounded-3xl p-6 shadow-premium hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">
                              <div className={`w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center text-2xl font-black shadow-lg transform transition-all group-hover:scale-105 duration-300`}>
                                {step.num || (idx + 1).toString()}
                              </div>
                              <div className="space-y-1.5">
                                <h3 className="text-lg font-black text-foreground">{step.title}</h3>
                                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-semibold">{step.desc}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            );

          // ─── معلمون مميزون (Featured Teachers) ───────────────────
          case 'featured_teachers':
            if (featuredTeachers.length === 0) return null;
            return (
              <section key={section.id} className="py-24 bg-muted/20">
                <div className="max-w-6xl mx-auto px-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between mb-12 gap-4 text-center sm:text-right">
                    <div>
                      {props.title && <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-foreground">{props.title}</h2>}
                      {props.subtitle && <p className="text-sm md:text-base text-muted-foreground font-medium">{props.subtitle}</p>}
                    </div>
                    <Link
                      href="/teachers"
                      className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/15 px-6 py-3 rounded-full text-sm cursor-pointer shadow-sm"
                    >
                      عرض الكل <Lucide.ArrowLeft className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredTeachers.map((t) => (
                      <Link
                        key={t.id}
                        href={`/teachers/${t.slug}`}
                        className="hover-card group bg-card border border-border/80 rounded-3xl overflow-hidden shadow-premium hover:shadow-xl transition-all duration-300"
                      >
                        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center relative">
                          <div className="absolute top-4 end-4 flex gap-2">
                             {t.verificationLevel !== 'NONE' && (
                              <span className="text-[10px] bg-white dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full px-3 py-1 font-bold shadow-sm flex items-center gap-1 border border-emerald-100 dark:border-emerald-900">
                                <Lucide.ShieldCheck className="w-3.5 h-3.5" /> موثق
                              </span>
                            )}
                          </div>
                          {t.profileImageUrl ? (
                            <Image
                              src={t.profileImageUrl}
                              alt={t.user.name}
                              width={80}
                              height={80}
                              className="w-20 h-20 rounded-full object-cover border-4 border-card shadow-lg translate-y-6"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary border-4 border-card shadow-lg translate-y-6">
                              {t.user.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="pt-10 px-6 pb-6 text-center">
                          <h3 className="font-extrabold text-lg group-hover:text-primary transition-colors mb-1 text-foreground">
                            {t.user.name}
                          </h3>
                          <p className="text-xs text-muted-foreground font-semibold mb-4">{t.specialization} {t.city && `· ${t.city}`}</p>
                          
                          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground border-t border-border/50 pt-4">
                            <span className="flex items-center gap-1 font-bold text-foreground">
                              <Lucide.Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                              {Number(t.averageRating).toFixed(1)} <span className="font-normal text-muted-foreground">({t.totalReviews})</span>
                            </span>
                            <span className="flex items-center gap-1 font-bold text-foreground">
                              <Lucide.PlayCircle className="w-3.5 h-3.5 text-blue-500" />
                              {t.totalSessions} <span className="font-normal text-muted-foreground">جلسة</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );

          // ─── آراء أولياء الأمور (Testimonials) ─────────────────
          case 'testimonials':
            return (
              <section key={section.id} className="py-24 bg-primary/5 dark:bg-primary/10">
                <div className="max-w-6xl mx-auto px-6">
                  {(props.title || props.subtitle) && (
                    <div className="text-center mb-16">
                      {props.title && <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground">{props.title}</h2>}
                      {props.subtitle && <p className="text-sm md:text-base text-muted-foreground font-medium">{props.subtitle}</p>}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {(props.items || []).map((t: any, i: number) => (
                      <div 
                        key={i} 
                        className="bg-card p-8 rounded-3xl shadow-premium border border-border/80 relative flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-amber-400 flex gap-0.5 mb-5">
                            {[1, 2, 3, 4, 5].map(s => <Lucide.Star key={s} className="w-4 h-4 fill-current" />)}
                          </div>
                          <p className="text-sm md:text-base mb-8 leading-relaxed font-bold text-foreground/90">«{t.text}»</p>
                        </div>
                        <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-base shrink-0">
                            {t.author?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-foreground">{t.author}</h4>
                            <span className="text-[10px] text-muted-foreground font-semibold">{t.city}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          // ─── الأسئلة الشائعة (FAQ) ─────────────────────────────
          case 'faq':
            if (faqs.length === 0) return null;
            return (
              <section key={section.id} className="py-24 bg-background">
                <div className="max-w-4xl mx-auto px-6">
                  {(props.title || props.subtitle) && (
                    <div className="text-center mb-16">
                      {props.title && <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground">{props.title}</h2>}
                      {props.subtitle && <p className="text-sm md:text-base text-muted-foreground font-medium">{props.subtitle}</p>}
                    </div>
                  )}
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <details 
                        key={faq.id} 
                        className="group bg-card border border-border/80 rounded-2xl p-4 md:p-5 cursor-pointer transition-all duration-300 [&_summary::-webkit-details-marker]:hidden"
                      >
                        <summary className="flex items-center justify-between gap-1.5 focus:outline-none">
                          <h3 className="font-bold text-sm md:text-base text-foreground/95 select-none pr-1">
                            {faq.question}
                          </h3>
                          <span className="shrink-0 p-1.5 bg-primary/10 text-primary rounded-lg group-open:rotate-180 transition-transform duration-300">
                            <Lucide.ChevronDown className="w-4 h-4" />
                          </span>
                        </summary>
                        <div className="mt-4 border-t border-border/50 pt-4">
                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                            {faq.answer}
                          </p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </section>
            );

          // ─── دعوة للتسجيل الفوري (CTA) ─────────────────────────
          case 'cta':
            return (
              <section key={section.id} className="py-24 relative overflow-hidden border-t border-border/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-700"></div>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                
                <div className="relative max-w-6xl mx-auto px-6 z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-right" dir="rtl">
                  {/* النصوص والدعوة */}
                  <div className="lg:col-span-8 flex flex-col items-center lg:items-start text-center lg:text-right space-y-6 text-white">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight">{props.title}</h2>
                    <p className="text-white/85 text-sm md:text-lg max-w-2xl leading-relaxed font-light">
                      {props.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto pt-2">
                      {props.primaryBtnText && (
                        <Link
                          href={props.primaryBtnLink || '/register'}
                          className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-gray-50 font-black rounded-2xl px-10 py-4 text-base md:text-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                        >
                          {props.primaryBtnText}
                        </Link>
                      )}
                      {props.secondaryBtnText && (
                        <Link
                          href={props.secondaryBtnLink || '/teachers'}
                          className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl px-10 py-4 text-base md:text-lg transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-pointer"
                        >
                          {props.secondaryBtnText}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* نجيب بوضعية الاحتفال (ثابت بدون حركة) */}
                  <div className="lg:col-span-4 flex justify-center lg:justify-end">
                    <NajeebCharacter mode="success" size="lg" animated={false} />
                  </div>
                </div>
              </section>
            );

          // ─── كود HTML مخصص (Custom HTML) ──────────────────────
          case 'custom_html':
            if (!props.html) return null;
            return (
              <section key={section.id} className="py-12 bg-background">
                <div className="max-w-6xl mx-auto px-6">
                  <div dangerouslySetInnerHTML={{ __html: props.html }} />
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      <Footer />
    </div>
  );
}
