'use client';

import { useState } from 'react';
import BookingCard from '@/components/shared/BookingCard';
import type { DetailedBooking } from '@/lib/types';
import { Calendar, FileText, HelpCircle, Plus } from 'lucide-react';
import Link from 'next/link';

interface ParentBookingsListProps {
  bookings: DetailedBooking[];
}

export default function ParentBookingsList({ bookings }: ParentBookingsListProps) {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PENDING' | 'COMPLETED' | 'ARCHIVED'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. حساب الإحصائيات ديناميكياً
  const upcomingCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const reportsCount = bookings.filter(b => b.status === 'COMPLETED' && b.report).length;

  // 2. فلترة البيانات حسب التبويب النشط والبحث
  const getFilteredData = () => {
    return bookings.filter((b) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        b.student.name.toLowerCase().includes(query) ||
        b.teacherService.teacher.user.name.toLowerCase().includes(query) ||
        b.teacherService.serviceType.name.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      switch (activeTab) {
        case 'UPCOMING':
          return b.status === 'CONFIRMED';
        case 'PENDING':
          return b.status === 'PENDING';
        case 'COMPLETED':
          return b.status === 'COMPLETED';
        case 'ARCHIVED':
          return b.status === 'CANCELLED' || b.status === 'REJECTED';
        default:
          return true;
      }
    });
  };

  const filtered = getFilteredData();

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 📊 بطاقات الإحصائيات العلوية المميزة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-semibold">الحصص المؤكدة القادمة</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{upcomingCount}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-semibold">التقارير التعليمية المستلمة</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{reportsCount}</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <Link 
          href="/teachers"
          className="glass-card bg-primary/5 hover:bg-primary/10 border border-primary/20 p-5 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-semibold">هل تريد جدولة درس جديد؟</span>
            <span className="text-sm font-extrabold text-primary flex items-center gap-1">
              ابحث عن معلم الآن 
              <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
            </span>
          </div>
          <div className="p-3 bg-primary/15 text-primary rounded-xl group-hover:scale-105 transition-transform">
            <Plus className="h-6 w-6" />
          </div>
        </Link>
      </div>

      {/* 🔍 أدوات التحكم والبحث */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-2.5 rounded-2xl border border-border shadow-xs">
        
        {/* أزرار التبويبات الفعالة */}
        <div className="flex bg-muted/40 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'UPCOMING'
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📅 الحصص القادمة ({upcomingCount})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ⏳ الطلبات المعلقة ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'COMPLETED'
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ✅ الحصص المنتهية
          </button>
          <button
            onClick={() => setActiveTab('ARCHIVED')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ARCHIVED'
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📁 الأرشيف
          </button>
        </div>

        {/* شريط البحث المدمج */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="ابحث باسم الطالب، المعلم، أو المادة..."
            className="premium-input w-full text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 📭 عرض النتائج والبطاقات */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border border-dashed rounded-2xl text-center">
          <HelpCircle className="h-10 w-10 text-muted-foreground/40 mb-3 animate-pulse" />
          <p className="text-sm font-bold text-foreground/80">لا توجد حصص في هذا القسم</p>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery ? 'جرب البحث بكلمات أخرى أو تغيير تبويب الفلترة.' : 'لم تقم بجدولة أي حصص هنا بعد.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-200">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              role="PARENT"
            />
          ))}
        </div>
      )}
    </div>
  );
}
