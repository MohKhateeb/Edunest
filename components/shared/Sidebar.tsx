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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
    setMounted(true);
  }, []);

  if (!session?.user?.userType) return null;

  const role = session.user.userType;

  // Define sidebar links based on user roles
  const parentLinks = [
    { href: '/dashboard/parent', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/dashboard/parent/students', label: 'إدارة الطلاب', icon: Users },
    { href: '/dashboard/parent/bookings', label: 'حجوزاتي', icon: Calendar },
    { href: '/dashboard/parent/bookings/new', label: 'حجز جلسة جديدة', icon: CalendarPlus },
    { href: '/dashboard/parent/faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
  ];

  const teacherLinks = [
    { href: '/dashboard/teacher', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/dashboard/teacher/profile', label: 'تعديل الملف الشخصي', icon: UserCheck },
    { href: '/dashboard/teacher/services', label: 'إدارة الخدمات', icon: Briefcase },
    { href: '/dashboard/teacher/availability', label: 'أوقات التوفر الأسبوعية', icon: Clock },
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
    { href: '/dashboard/admin/payments', label: 'تأكيد المدفوعات', icon: CreditCard },
    { href: '/dashboard/admin/payouts', label: 'تسويات المعلمين', icon: BadgeDollarSign },
    { href: '/dashboard/admin/settings', label: 'إعدادات النظام', icon: Settings },
    { href: '/dashboard/admin/settings/homepage', label: 'إعدادات الصفحة الرئيسية', icon: Settings },
    { href: '/dashboard/admin/verification', label: 'طلبات التوثيق', icon: ShieldCheck },
    { href: '/dashboard/admin/faq', label: 'إدارة الأسئلة الشائعة', icon: HelpCircle },
  ];

  const links = role === 'ADMIN' ? adminLinks : role === 'TEACHER' ? teacherLinks : parentLinks;

  const toggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('sidebar-collapsed', String(nextValue));
  };

  return (
    <aside
      className={cn(
        "bg-slate-950 border-l border-slate-900 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col p-4 text-right transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
      dir="rtl"
    >
      {/* Header and Collapse Trigger */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-900/60 pb-3 gap-1">
        {!isCollapsed && (
          <span className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate animate-in fade-in duration-300">
            {role === 'ADMIN' ? 'لوحة المدير' : role === 'TEACHER' ? 'لوحة المعلم' : 'لوحة ولي الأمر'}
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className={cn(
            "p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
        >
          {isCollapsed ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5">
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
                  ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              )}
              title={isCollapsed ? link.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors duration-200",
                  isActive ? "text-primary-foreground" : "text-slate-500 group-hover:text-primary"
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
    </aside>
  );
}
