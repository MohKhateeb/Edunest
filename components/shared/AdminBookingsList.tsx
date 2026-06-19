'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DetailedBooking } from '@/lib/types';
import { BOOKING_STATUS_AR, PAYMENT_STATUS_AR, PAYMENT_METHOD_AR } from '@/lib/translations';
import { formatLocalTime, formatPrice } from '@/lib/utils';
import { cancelBooking } from '@/lib/actions/booking';
import { Search, Filter, MoreVertical, XCircle, FileText, ChevronRight, ChevronLeft, Calendar, BookOpen, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DetailsModal from '@/components/shared/DetailsModal';
import Portal from '@/components/shared/Portal';
import DataTable from '@/components/shared/DataTable';

interface AdminBookingsListProps {
  bookings: DetailedBooking[];
}

export default function AdminBookingsList({ bookings }: AdminBookingsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Actions State
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null);

  // Filtering
  const filteredBookings = bookings.filter((b) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      b.student.name.toLowerCase().includes(query) ||
      b.parent.name.toLowerCase().includes(query) ||
      b.teacherService.teacher.user.name.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query);
      
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentData = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // Handlers
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) return;
    
    if (cancelReason.trim().length < 5) {
      toast.warning('سبب الإلغاء قصير جداً');
      return;
    }
    
    setLoading(true);
    const res = await cancelBooking({ bookingId: selectedBookingId, reason: cancelReason });
    setLoading(false);
    
    if (res.success) {
      toast.success('تم الإلغاء بنجاح');
      setShowCancelModal(false);
      setCancelReason('');
      router.refresh();
    } else {
      toast.error('فشل الإلغاء', { description: res.error });
    }
  };

  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    CONFIRMED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    CANCELLED: 'bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-400',
  };

  return (
    <div className="space-y-4">
      <DataTable
        data={currentData}
        headers={['معلومات الجلسة', 'المعلم والخدمة', 'الطالب وولي الأمر', 'الدفع', 'الحالة', 'إجراءات']}
        searchQuery={searchQuery}
        setSearchQuery={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="بحث بالاسم، أو رقم الحجز..."
        toolbarChildren={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <select
              className="premium-input text-sm w-full sm:w-48"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">كل الحالات ({bookings.length})</option>
              <option value="PENDING">معلق</option>
              <option value="CONFIRMED">مؤكد</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>
        }
        emptyMessage="لا توجد حجوزات مطابقة لمعايير البحث الحالية."
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredBookings.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        paginationLabel="حجز"
        renderRow={(booking) => (
          <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
            {/* Date & Time */}
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {new Date(booking.startTime).toLocaleDateString('ar-PS')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(booking.startTime).toLocaleTimeString('ar-PS', { hour: '2-digit', minute: '2-digit' })}
                  {' '}({booking.duration} دقيقة)
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono mt-1" title={booking.id}>
                  #{booking.id.slice(-6).toUpperCase()}
                </span>
              </div>
            </td>

            {/* Teacher & Service */}
            <td className="px-6 py-4">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-foreground">
                  {booking.teacherService.teacher.user.name}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {booking.teacherService.serviceType.name}
                </span>
                {booking.isTrial && (
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded w-fit mt-0.5">
                    جلسة تجريبية
                  </span>
                )}
              </div>
            </td>

            {/* Student & Parent */}
            <td className="px-6 py-4">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                  {booking.student.name} <span className="text-xs font-normal text-muted-foreground">(الصف {booking.student.grade})</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  ولي الأمر: {booking.parent.name}
                </span>
              </div>
            </td>

            {/* Payment */}
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-foreground">
                  {booking.isTrial ? 'مجانية' : formatPrice(Number(booking.price))}
                </span>
                {!booking.isTrial && (
                  <span className="text-xs text-muted-foreground">
                    {PAYMENT_STATUS_AR[booking.paymentStatus]}
                  </span>
                )}
              </div>
            </td>

            {/* Status */}
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <span className={cn('px-3 py-1 text-xs font-bold rounded-full', statusStyles[booking.status])}>
                {BOOKING_STATUS_AR[booking.status]}
              </span>
            </td>

            {/* Actions */}
            <td className="px-6 py-4 whitespace-nowrap text-center relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === booking.id ? null : booking.id)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {/* Dropdown Menu */}
              {activeDropdown === booking.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                  <div className="absolute start-6 top-10 z-20 w-48 bg-card border border-border rounded-xl shadow-lg py-1 text-right overflow-hidden animate-in fade-in slide-in-from-top-2">
                    
                    <button
                      onClick={() => {
                        setSelectedDetailsId(booking.id);
                        setActiveDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent flex items-center gap-2 transition-colors border-b border-border/40 cursor-pointer"
                    >
                      <Search className="h-4 w-4 text-primary" />
                      عرض التفاصيل كاملة
                    </button>

                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <button
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          setShowCancelModal(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <XCircle className="h-4 w-4" />
                        إلغاء إداري
                      </button>
                    )}

                    {booking.status === 'COMPLETED' && booking.report && (
                      <button
                        onClick={() => {
                          setSelectedReport(booking.report);
                          setShowReportModal(true);
                          setActiveDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        عرض التقرير
                      </button>
                    )}

                    {booking.status !== 'PENDING' && booking.status !== 'CONFIRMED' && !booking.report && (
                      <div className="px-4 py-3 text-xs text-muted-foreground italic text-center">
                        لا توجد إجراءات إضافية
                      </div>
                    )}
                  </div>
                </>
              )}
            </td>
          </tr>
        )}
      />

      {/* Cancel Modal */}
      {showCancelModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
            <form onSubmit={handleCancelSubmit} className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl my-8">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                إلغاء حجز (إجراء إداري)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                بصفتك مدير النظام، فإن إلغاءك لهذا الحجز سيتجاوز شروط الإلغاء العادية وسيعتبر نهائياً. سيتم إشعار المعلم وولي الأمر.
              </p>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="اكتب سبب الإلغاء الإداري هنا (سيرسَل للأطراف المعنية)..."
                className="w-full text-sm premium-input resize-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setSelectedBookingId(null);
                  }}
                  className="text-xs font-semibold border border-border hover:bg-accent px-4 py-2 rounded-lg cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {loading ? 'جاري الإلغاء...' : 'تنفيذ الإلغاء'}
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* View Report Modal */}
      {showReportModal && selectedReport && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
            <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-xl relative my-8">
              <h3 className="font-extrabold text-lg border-b border-border pb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                تقرير الجلسة (للاطلاع الإداري)
              </h3>
              
              <div className="space-y-4 text-sm">
                <div className="bg-accent/30 p-3 rounded-lg">
                  <span className="text-xs font-bold block mb-1">حضور الطالب:</span>
                  <span className={selectedReport.studentAttended ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {selectedReport.studentAttended ? '✓ حضر الجلسة' : '✗ غاب عن الجلسة'}
                  </span>
                </div>
                
                <div>
                  <span className="text-xs text-muted-foreground font-bold block mb-1">المواضيع المغطاة:</span>
                  <p className="bg-card border border-border p-3 rounded-lg whitespace-pre-wrap">{selectedReport.topicsCovered}</p>
                </div>

                {selectedReport.teacherNotes && (
                  <div>
                    <span className="text-xs text-muted-foreground font-bold block mb-1">ملاحظات المعلم السفلية:</span>
                    <p className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 p-3 rounded-lg text-yellow-800 dark:text-yellow-400 whitespace-pre-wrap">
                      {selectedReport.teacherNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <DetailsModal
        isOpen={!!selectedDetailsId}
        onClose={() => setSelectedDetailsId(null)}
        entityType="booking"
        entityId={selectedDetailsId}
      />
    </div>
  );
}
