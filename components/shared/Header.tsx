'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Search,
  GraduationCap,
  Users,
  Calendar,
  CalendarPlus,
  UserCheck,
  Briefcase,
  Clock,
  BadgeDollarSign,
  FileCheck,
  CreditCard,
  Settings,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';

export default function Header() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

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
    { href: '/dashboard/admin/verification', label: 'طلبات التوثيق', icon: ShieldCheck },
    { href: '/dashboard/admin/faq', label: 'إدارة الأسئلة الشائعة', icon: HelpCircle },
  ];

  const role = session?.user?.userType;
  const links = role === 'ADMIN' ? adminLinks : role === 'TEACHER' ? teacherLinks : parentLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border glass shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold text-primary tracking-tight">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span>إيدونِست</span>
              <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full font-normal">EduNest</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <Link href="/teachers" className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              البحث عن معلمين
            </Link>
            <Link href="/help" className="text-sm font-semibold hover:text-primary transition-colors">
              مركز المساعدة
            </Link>
            <Link href="/privacy" className="text-sm font-semibold hover:text-primary transition-colors">
              سياسة الخصوصية
            </Link>
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <div className="h-6 w-px bg-border mx-1" />
                <Link
                  href={
                    session.user.userType === 'ADMIN'
                      ? '/dashboard/admin'
                      : session.user.userType === 'TEACHER'
                      ? '/dashboard/teacher'
                      : '/dashboard/parent'
                  }
                  className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-all shadow-sm"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  لوحة التحكم
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium border border-border hover:bg-accent text-destructive hover:text-destructive px-3 py-2 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-foreground/80 hover:text-primary transition-colors px-3 py-2"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-all shadow-sm"
                >
                  إنشاء حساب جديد
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-primary p-2 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-card/95 border-b border-border absolute w-full start-0 transition-all duration-300 ease-in-out shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-primary transition-colors"
            >
              الرئيسية
            </Link>
            <Link
              href="/teachers"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-primary transition-colors"
            >
              البحث عن معلمين
            </Link>
            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-primary transition-colors"
            >
              مركز المساعدة
            </Link>
            <Link
              href="/privacy"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-primary transition-colors"
            >
              سياسة الخصوصية
            </Link>

            <div className="border-t border-border my-2 pt-2">
              {session ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      مرحباً، {session.user.name}
                    </div>
                    <div className="flex items-center">
                      <NotificationBell />
                    </div>
                  </div>
                  <Link
                    href={
                      session.user.userType === 'ADMIN'
                        ? '/dashboard/admin'
                        : session.user.userType === 'TEACHER'
                        ? '/dashboard/teacher'
                        : '/dashboard/parent'
                    }
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    لوحة التحكم
                  </Link>

                  {/* Mobile Dashboard Sub-links */}
                  {links.length > 0 && (
                    <div className="mt-1.5 pe-4 ps-2 space-y-1 border-e-2 border-primary/20">
                      {links.map((link) => {
                        const LinkIcon = link.icon;
                        const isLinkActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isLinkActive
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-foreground/80 hover:bg-accent hover:text-primary'
                            }`}
                          >
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{link.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/10 transition-colors text-right"
                  >
                    <LogOut className="h-5 w-5" />
                    تسجيل الخروج
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-2">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-center px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
