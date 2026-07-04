"use client";
import { useTranslations } from "next-intl";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DailySchedule } from "@/components/bookings/DailySchedule";
import { TeacherBookingsSummary } from "@/components/bookings/TeacherBookingsSummary";
import { TeacherCalendar } from "@/components/bookings/TeacherCalendar";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DetailsModal from "@/components/shared/DetailsModal";
import ReportModal from "@/components/shared/ReportModal";
import { acceptBooking, rejectBooking, cancelBooking } from "@/lib/actions/booking";
import type { DetailedBooking } from "@/lib/types";
import { getLocalDateString } from "@/lib/utils/time";

interface TeacherBookingsListProps {
	bookings: DetailedBooking[];
}

export default function TeacherBookingsList({
	bookings,
}: TeacherBookingsListProps) {
    const t = useTranslations('teachers')
	// Search and Filter
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");

	// Dates and Selection
	const [currentDate, setCurrentDate] = useState(() => new Date());
	const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
		getLocalDateString(new Date()),
	);
	const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
		null,
	);
	const [reportBookingId, setReportBookingId] = useState<string | null>(null);
	const [cancelDialogBookingId, setCancelDialogBookingId] = useState<string | null>(null);
	const [loadingId, setLoadingId] = useState<string | null>(null);

	// Time ticker for active status
	const [, setNow] = useState(() => Date.now());
	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 30000);
		return () => clearInterval(interval);
	}, []);

	const filteredBookings = useMemo(() => {
		return bookings.filter((b) => {
			const query = searchQuery.toLowerCase();
			const matchesSearch =
				b.student.name.toLowerCase().includes(query) ||
				b.parent.name.toLowerCase().includes(query) ||
				b.teacherService.serviceType.name.toLowerCase().includes(query) ||
				(b.questionTitle && b.questionTitle.toLowerCase().includes(query));
			const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [bookings, searchQuery, statusFilter]);

	const selectedDayBookings = useMemo(() => {
		return filteredBookings.filter(
			(b) => getLocalDateString(new Date(b.startTime)) === selectedDateStr,
		);
	}, [filteredBookings, selectedDateStr]);

	const handleAcceptShortcut = async (
		bookingId: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		setLoadingId(bookingId);
		try {
			const res = await acceptBooking(bookingId);
			if (!res.success) {
				toast.error(t('key_1783109436156_pg1f'), { description: res.error });
			} else {
				toast.success(t('key_1783109436164_hug4'));
			}
		} catch (err) {
			console.error(err);
			toast.error(t('key_1783109436171_aid5'));
		} finally {
			setLoadingId(null);
		}
	};

	const handleRejectShortcut = async (
		bookingId: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		setLoadingId(bookingId);
		try {
			const res = await rejectBooking(bookingId);
			if (!res.success) {
				toast.error(t('key_1783109436178_f8ot'), { description: res.error });
			} else {
				toast.success(t('key_1783109436185_tdvv'));
			}
		} catch (err) {
			console.error(err);
			toast.error(t('key_1783109436192_mjtp'));
		} finally {
			setLoadingId(null);
		}
	};

	const handleCancelShortcut = (
		bookingId: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		setCancelDialogBookingId(bookingId);
	};

	const executeCancelBooking = async (reason?: string) => {
		if (!cancelDialogBookingId || !reason) return;

		setLoadingId(cancelDialogBookingId);
		try {
			const res = await cancelBooking({ bookingId: cancelDialogBookingId, reason });
			if (!res.success) {
				toast.error(t('key_1783109436199_bqof'), { description: res.error });
			} else {
				toast.success(t('key_1783109436205_oven'));
			}
		} catch (err) {
			console.error(err);
			toast.error(t('key_1783109436212_eb76'));
		} finally {
			setLoadingId(null);
			setCancelDialogBookingId(null);
		}
	};

	return (
		<div className="space-y-6">
			{/* 1. Summary Stats */}
			<TeacherBookingsSummary bookings={bookings} />

			{/* 2. Filters & Search */}
			<div className="flex flex-col md:flex-row gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
				<div className="relative flex-1">
					<input
						type="text"
						placeholder="ابحث باسم الطالب، ولي الأمر، المادة، أو موضوع الجلسة..."
						className="premium-input w-full text-sm ps-10 pe-4 py-3 rounded-2xl border border-border/80 bg-background"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<span className="absolute start-3.5 top-3.5 text-muted-foreground">
						<Search className="h-5 w-5" />
					</span>
				</div>
				<select
					className="premium-input text-sm md:w-64 py-3 px-4 rounded-2xl border border-border/80 bg-background"
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
				>
					<option value="ALL">{t('key_1783109435963_qre0')}</option>
					<option value="PENDING_APPROVAL">{t('key_1783109436012_61yy')}</option>
					<option value="AWAITING_PAYMENT">{t('key_1783109436034_y43e')}</option>
					<option value="PENDING">{t('key_1783109436053_d0rc')}</option>
					<option value="CONFIRMED">{t('key_1783109436069_i44p')}</option>
					<option value="COMPLETED">{t('key_1783109436088_euwb')}</option>
					<option value="CANCELLED">{t('key_1783109436108_6h96')}</option>
					<option value="REJECTED">{t('key_1783109436130_m0sj')}</option>
				</select>
			</div>

			{/* 3. Main Grid Layout (Calendar + Daily Schedule) */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* Left Side: Schedule (Col Span 8) */}
				<div className="lg:col-span-8 order-2 lg:order-1">
					<DailySchedule
						dateStr={selectedDateStr}
						bookings={selectedDayBookings}
						onBookingClick={setSelectedBookingId}
						onReportClick={setReportBookingId}
						loadingId={loadingId}
						handleAcceptShortcut={handleAcceptShortcut}
						handleRejectShortcut={handleRejectShortcut}
						handleCancelShortcut={handleCancelShortcut}
					/>
				</div>

				{/* Right Side: Calendar (Col Span 4) */}
				<div className="lg:col-span-4 order-1 lg:order-2 sticky top-6">
					<TeacherCalendar
						bookings={filteredBookings}
						currentDate={currentDate}
						setCurrentDate={setCurrentDate}
						selectedDateStr={selectedDateStr}
						setSelectedDateStr={setSelectedDateStr}
					/>
				</div>
			</div>

			<DetailsModal
				isOpen={!!selectedBookingId}
				onClose={() => setSelectedBookingId(null)}
				entityType="booking"
				entityId={selectedBookingId}
			/>

			<ReportModal
				bookingId={reportBookingId}
				onClose={() => setReportBookingId(null)}
			/>

			<ConfirmDialog
				isOpen={!!cancelDialogBookingId}
				title="إلغاء الموعد"
				description="هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟ سيتم تحرير الموعد للطلاب الآخرين."
				requireReason={true}
				reasonLabel={t('str_2LPYqNio')}
				confirmLabel={t('str_2KrYo9mD')}
				isLoading={loadingId === cancelDialogBookingId}
				onConfirm={(reason) => executeCancelBooking(reason)}
				onCancel={() => setCancelDialogBookingId(null)}
			/>
		</div>
	);
}
