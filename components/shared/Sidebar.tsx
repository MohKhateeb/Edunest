'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarPlus,
  UserCheck,
  CreditCard,
  Settings,
  ShieldCheck,
  FileCheck,
  Clock,
  Briefcase,
  BadgeDollarSign,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import HakeemCharacter from '@/components/shared/HakeemCharacter';
import NajeebCharacter from '@/components/shared/NajeebCharacter';

// Define sidebar links based on user roles at module level
const parentLinks = [
  { href: '/dashboard/parent', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/dashboard/parent/students', label: 'إدارة الطلاب', icon: Users },
  { href: '/dashboard/parent/bookings', label: 'حجوزاتي', icon: Calendar },
  { href: '/dashboard/parent/live', label: 'فزعة سريعة (أوبر) ⚡', icon: CalendarPlus },
  { href: '/dashboard/parent/requests', label: 'الطلبات المجدولة', icon: Briefcase },
  { href: '/dashboard/parent/financials', label: 'السجل المالي', icon: CreditCard },
  { href: '/dashboard/parent/faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
];

const teacherLinks = [
  { href: '/dashboard/teacher', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/dashboard/teacher/profile', label: 'تعديل الملف الشخصي', icon: UserCheck },
  { href: '/dashboard/teacher/services', label: 'إدارة الخدمات', icon: Briefcase },
  { href: '/dashboard/teacher/availability', label: 'أوقات التوفر الأسبوعية', icon: Clock },
  { href: '/dashboard/teacher/live', label: 'الرادار الحي 📡', icon: CalendarPlus },
  { href: '/dashboard/teacher/requests', label: 'الطلبات المجدولة', icon: Briefcase },
  { href: '/dashboard/teacher/bookings', label: 'الحجوزات الواردة', icon: Calendar },
  { href: '/dashboard/teacher/earnings', label: 'الأرباح والتسويات', icon: BadgeDollarSign },
  { href: '/dashboard/teacher/verification', label: 'رفع وثائق التوثيق', icon: FileCheck },
  { href: '/dashboard/teacher/faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
];

const adminLinks = [
  { href: '/dashboard/admin', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'إدارة المستخدمين', icon: Users },
  { href: '/dashboard/admin/teachers', label: 'إدارة المعلمين', icon: Users },
  { href: '/dashboard/admin/bookings', label: 'كل الحجوزات', icon: Calendar },
  { href: '/dashboard/admin/disputes', label: 'إدارة النزاعات', icon: ShieldAlert },
  { href: '/dashboard/admin/financials', label: 'الإدارة المالية الشاملة', icon: CreditCard },
  { href: '/dashboard/admin/payouts', label: 'تسويات المعلمين', icon: BadgeDollarSign },
  { href: '/dashboard/admin/settings', label: 'إعدادات النظام', icon: Settings },
  { href: '/dashboard/admin/settings/homepage', label: 'إعدادات الصفحة الرئيسية', icon: Settings },
  { href: '/dashboard/admin/verification', label: 'طلبات التوثيق', icon: ShieldCheck },
  { href: '/dashboard/admin/faq', label: 'إدارة الأسئلة الشائعة', icon: HelpCircle },
];

const ADVISOR_TIPS: Record<'PARENT' | 'TEACHER' | 'ADMIN', Array<{ advisor: 'hakeem' | 'najeeb'; text: string }>> = {
  PARENT: [
    { advisor: 'hakeem', text: 'التعليم ليس ملء دلو، بل إيقاد شعلة. تفقد أداء طفلك بانتظام للوقوف على نقاط قوته!' },
    { advisor: 'najeeb', text: 'رائع! متابعتك المستمرة لأطفالك تصنع الفارق الأكبر في رحلتهم التعليمية!' },
    { advisor: 'hakeem', text: 'الحوار الهادئ مع المعلم بعد كل حصة يساعد في سد الثغرات التعليمية بشكل أسرع.' },
    { advisor: 'najeeb', text: 'هل ألقيت نظرة على تقارير اليوم؟ أطفالنا يتفوقون يوماً بعد يوم!' },
  ],
  TEACHER: [
    { advisor: 'hakeem', text: 'المعلم الناجح هو من يستمع أكثر مما يتحدث. احرص على تدوين ملاحظات دقيقة في نهاية كل حصة.' },
    { advisor: 'najeeb', text: 'حصصك تلهم طاقات المستقبل! استمر في إبهار طلابك بشغفك وعطائك!' },
    { advisor: 'hakeem', text: 'تحديث أوقات توفرك الأسبوعية يسهل على أولياء الأمور التنسيق معك مبكراً.' },
    { advisor: 'najeeb', text: 'رائع! تقاريرك الدقيقة تسعد أولياء الأمور وتبني ثقة عميقة بينكم.' },
  ],
  ADMIN: [
    { advisor: 'hakeem', text: 'النظام المستقر يبدأ من المتابعة الدقيقة. تفقد قائمة طلبات التوثيق بانتظام لضمان الجودة.' },
    { advisor: 'najeeb', text: 'أنت صمام الأمان لمنصة إديونست! جهودك في إدارة النظام تدفعنا للأمام!' },
  ],
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
    setMounted(true);
    // Seed initial tip index based on date
    setTipIndex(new Date().getDate());
  }, []);

  if (!session?.user?.userType) return null;

  const role = session.user.userType;
  const links = role === 'ADMIN' ? adminLinks : role === 'TEACHER' ? teacherLinks : parentLinks;

  const toggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('sidebar-collapsed', String(nextValue));
  };

  // Advisor tips selection
  const tips = ADVISOR_TIPS[role as keyof typeof ADVISOR_TIPS] || ADVISOR_TIPS.PARENT;
  const activeTip = tips[tipIndex % tips.length];

  const cycleTip = () => {
    setTipIndex((prev) => prev + 1);
  };

  return (
    <aside
      className={cn(
        "bg-white dark:bg-slate-950 border-l border-slate-100 dark:border-slate-900/60 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col p-4 text-right transition-all duration-300 ease-in-out select-none shadow-sm",
        isCollapsed ? "w-20" : "w-64"
      )}
      dir="rtl"
    >
      {/* Header and Collapse Trigger */}
      <div className="flex items-center justify-between mb-5 border-b border-border/50 pb-3.5 gap-1">
        {!isCollapsed && (
          <span className={cn(
            "px-3 py-1 text-[10px] font-extrabold rounded-full tracking-widest truncate animate-in fade-in duration-300",
            role === 'ADMIN' && "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400",
            role === 'TEACHER' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
            role === 'PARENT' && "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
          )}>
            {role === 'ADMIN' ? 'لوحة المشرف' : role === 'TEACHER' ? 'لوحة المعلم' : 'لوحة ولي الأمر'}
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className={cn(
            "p-1.5 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
        >
          {isCollapsed ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden min-h-0 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center rounded-xl text-xs font-bold transition-all duration-200",
                isCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5",
                isActive
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md shadow-primary/20 scale-[1.02] transform"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-primary dark:hover:text-white"
              )}
              title={isCollapsed ? link.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors duration-200",
                  isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-primary"
                )}
              />
              {!isCollapsed && (
                <span className="truncate animate-in fade-in duration-300">
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Advisor Interactive Block (Hakeem & Najeeb) */}
      <div className="border-t border-border/50 pt-4 mt-auto">
        {!isCollapsed ? (
          <div className="bg-gradient-to-br from-indigo-50/50 to-primary/5 dark:from-slate-900/60 dark:to-primary/10 border border-primary/15 rounded-2xl p-3 shadow-sm text-right animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {activeTip.advisor === 'hakeem' ? 'مستشارنا الحكيم' : 'الملهم نجيب'}
              </span>
              <button 
                onClick={cycleTip}
                className="text-[9px] font-black text-muted-foreground hover:text-primary cursor-pointer transition-colors"
              >
                نصيحة أخرى ⟳
              </button>
            </div>
            <div className="flex gap-2.5 items-center">
              <div className="flex-shrink-0 bg-white/40 dark:bg-slate-800/40 rounded-xl p-1 border border-primary/10">
                {activeTip.advisor === 'hakeem' ? (
                  <HakeemCharacter size="sm" className="w-10 h-10" />
                ) : (
                  <NajeebCharacter mode="study" size="xs" className="w-10 h-10" />
                )}
              </div>
              <p className="text-[10px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium flex-1">
                "{activeTip.text}"
              </p>
            </div>
          </div>
        ) : (
          <div className="group relative flex justify-center py-2">
            <button
              onClick={cycleTip}
              className="cursor-pointer hover:scale-110 transition-transform duration-200 focus:outline-none w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-50/50 to-primary/5 dark:from-slate-900/60 dark:to-primary/10 border border-primary/15 rounded-xl p-1"
              title="نصيحة اليوم"
            >
              {activeTip.advisor === 'hakeem' ? (
                <HakeemCharacter size="sm" className="w-8 h-8" />
              ) : (
                <NajeebCharacter mode="study" size="xs" className="w-8 h-8" />
              )}
            </button>
            
            {/* Rich Tooltip popup on hover */}
            <div className="absolute start-full ms-3 top-1/2 -translate-y-1/2 hidden group-hover:block w-52 bg-white dark:bg-slate-900 border border-border/80 text-foreground text-[10px] p-3 rounded-2xl shadow-premium z-50 pointer-events-none text-right animate-in fade-in zoom-in-95 duration-200">
              <div className="font-black text-primary mb-2 border-b border-border/50 pb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {activeTip.advisor === 'hakeem' ? 'مستشارنا الحكيم' : 'الملهم نجيب'}
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5 border border-primary/10">
                  {activeTip.advisor === 'hakeem' ? (
                    <HakeemCharacter size="sm" className="w-7 h-7" />
                  ) : (
                    <NajeebCharacter mode="study" size="xs" className="w-7 h-7" />
                  )}
                </div>
                <p className="leading-relaxed font-semibold text-slate-700 dark:text-slate-300 flex-1">
                  {activeTip.text}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
