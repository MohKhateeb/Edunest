"use client";

import {
	BookOpen,
	Calendar,
	ChevronLeft,
	ChevronRight,
	FileText,
	Filter,
	MoreVertical,
	Search,
	User as UserIcon,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import DataTable from "@/components/shared/DataTable";
import DetailsModal from "@/components/shared/DetailsModal";
import Portal from "@/components/shared/Portal";
import { cancelBooking } from "@/lib/actions/booking";
import {
	BOOKING_STATUS_AR,
	BOOKING_STATUS_STYLES,
	PAYMENT_METHOD_AR,
	PAYMENT_STATUS_AR,
} from "@/lib/translations";
import type { DetailedBooking } from "@/lib/types";
import { BookingStatus } from "@prisma/client";
import { loadMoreAdminBookings } from "@/lib/actions/admin";
import { cn, formatLocalTime } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";

interface AdminBookingsListProps {
	initialData: {
		data: DetailedBooking[];
		nextCursor?: string;
		hasMore: boolean;
		totalCount?: number;
	};
}

export default function AdminBookingsList({
	initialData,
}: AdminBookingsListProps) {
	const router = useRouter();
	const [bookings, setBookings] = useState<DetailedBooking[]>(initialData.data);
	const [hasMore, setHasMore] = useState(initialData.hasMore);
	const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// Actions State
	const [loading, setLoading] = useState(false);
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

	const [showCancelModal, setShowCancelModal] = useState(false);
	const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
		null,
	);
	const [cancelReason, setCancelReason] = useState("");

	const [showReportModal, setShowReportModal] = useState(false);
	const [selectedReport, setSelectedReport] = useState<
		DetailedBooking["report"] | null
	>(null);

	const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(
		null,
	);

	// Filtering
	const filteredBookings = bookings.filter((b) => {
		const query = searchQuery.toLowerCase();
		const matchesSearch =
			b.student.name.toLowerCase().includes(query) ||
			b.parent.name.toLowerCase().includes(query) ||
			b.teacherService.teacher.user.name.toLowerCase().includes(query) ||
			b.id.toLowerCase().includes(query);

		const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	// Handlers
	const handleCancelSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedBookingId) return;

		if (cancelReason.trim().length < 5) {
			toast.warning(t('key_1783109430208_d394'));
			return;
		}

		setLoading(true);
		const res = await cancelBooking({
			bookingId: selectedBookingId,
			reason: cancelReason,
		});
		setLoading(false);

		if (res.success) {
			toast.success(t('key_1783109430217_gv0k'));
			setShowCancelModal(false);
			setCancelReason("");
			router.refresh();
		} else {
			toast.error(t('key_1783109430226_v1iu'), { description: res.error });
		}
	};

	const t = useTranslations("admin");
	const tCommon = useTranslations("common");

	return (
		<div className="space-y-4">
			<DataTable
				data={filteredBookings}
				headers={[
					t('key_1783109430235_94ld'),
					t('key_1783109430266_f6op'),
					t('key_1783109430275_rzoy'),
					t('key_1783109430283_p7go'),
					t('key_1783109430292_au5h'),
					t('key_1783109430300_mzxn'),
				]}
				searchQuery={searchQuery}
				setSearchQuery={(val) => {
					setSearchQuery(val);
					setCurrentPage(1);
				}}
				searchPlaceholder={t('key_1783109430309_finn')}
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
							<option value="ALL">{t("key_1783109429491_5s51")}{initialData.totalCount ?? bookings.length})</option>
							<option value="PENDING_APPROVAL">{t("key_1783109429544_2d61")}</option>
							<option value="AWAITING_PAYMENT">{t("key_1783109429582_ekac")}</option>
							<option value="PENDING">{t("key_1783109429606_jpx3")}</option>
							<option value="CONFIRMED">{t("key_1783109429636_qq3o")}</option>
							<option value="COMPLETED">{t("key_1783109429656_d939")}</option>
							<option value="CANCELLED">{t("key_1783109429765_qmkz")}</option>
							<option value="REJECTED">{t("key_1783109429791_gp5z")}</option>
							<option value="EXPIRED">{t("key_1783109429825_g7ny")}</option>
						</select>
					</div>
				}
				emptyMessage={t('str_mr6bilqp_2YTYpy')}
				renderRow={(booking) => (
					<tr key={booking.id} className="hover:bg-muted/30 transition-colors">
						{/* Date & Time */}
						<td className="px-6 py-4 whitespace-nowrap">
							<div className="flex flex-col gap-1">
								<span className="font-semibold text-foreground flex items-center gap-1.5">
									<Calendar className="h-3.5 w-3.5 text-primary" />
									{new Date(booking.startTime).toLocaleDateString("ar-PS")}
								</span>
								<span className="text-xs text-muted-foreground">
									{new Date(booking.startTime).toLocaleTimeString("ar-PS", {
										hour: "2-digit",
										minute: "2-digit",
									})}{" "}
									({booking.duration} {t('key_1783109429850_yqe2')}</span>
								<span
									className="text-[10px] text-muted-foreground/60 font-mono mt-1"
									title={booking.id}
								>
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
										{t('key_1783109429878_vt1y')}</span>
								)}
							</div>
						</td>

						{/* Student & Parent */}
						<td className="px-6 py-4">
							<div className="flex flex-col gap-1">
								<span className="font-bold text-foreground flex items-center gap-1">
									<UserIcon className="h-3.5 w-3.5 text-primary" />
									{booking.student.name}{" "}
									<span className="text-xs font-normal text-muted-foreground">
										{t('key_1783109429897_ym1r')}{booking.student.grade})
									</span>
								</span>
								<span className="text-xs text-muted-foreground">
									{t('key_1783109429934_7ewj')}{booking.parent.name}
								</span>
							</div>
						</td>

						{/* Payment */}
						<td className="px-6 py-4 whitespace-nowrap">
							<div className="flex flex-col gap-1">
								<span className="font-extrabold text-foreground">
									{booking.isTrial
										? t('str_2YXYrNin')
										: formatCurrency(Number(booking.price), booking.currency)}
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
							<span
								className={cn(
									"px-3 py-1 text-xs font-bold rounded-full",
									BOOKING_STATUS_STYLES[booking.status],
								)}
							>
								{BOOKING_STATUS_AR[booking.status]}
							</span>
						</td>

						{/* Actions */}
						<td className="px-6 py-4 whitespace-nowrap text-center relative">
							<button
								onClick={() =>
									setActiveDropdown(
										activeDropdown === booking.id ? null : booking.id,
									)
								}
								className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
							>
								<MoreVertical className="h-5 w-5" />
							</button>

							{/* Dropdown Menu */}
							{activeDropdown === booking.id && (
								<>
									<div
										className="fixed inset-0 z-10"
										onClick={() => setActiveDropdown(null)}
									/>
									<div className="absolute end-8 top-10 z-20 w-48 bg-card border border-border rounded-xl shadow-lg py-1 text-start overflow-hidden animate-in fade-in slide-in-from-top-2">
										<button
											onClick={() => {
												setSelectedDetailsId(booking.id);
												setActiveDropdown(null);
											}}
											className="w-full px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent flex items-center gap-2 transition-colors border-b border-border/40 cursor-pointer"
										>
											<Search className="h-4 w-4 text-primary" />
											{t('key_1783109429952_hnom')}</button>

										{(booking.status === "PENDING" ||
											booking.status === "PENDING_APPROVAL" ||
											booking.status === "AWAITING_PAYMENT" ||
											booking.status === "CONFIRMED") && (
											<button
												onClick={() => {
													setSelectedBookingId(booking.id);
													setShowCancelModal(true);
													setActiveDropdown(null);
												}}
												className="w-full px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors cursor-pointer"
											>
												<XCircle className="h-4 w-4" />
												{t('key_1783109429971_8w73')}</button>
										)}

										{booking.status === "COMPLETED" && booking.report && (
											<button
												onClick={() => {
													setSelectedReport(booking.report);
													setShowReportModal(true);
													setActiveDropdown(null);
												}}
												className="w-full px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent flex items-center gap-2 transition-colors cursor-pointer"
											>
												<FileText className="h-4 w-4 text-blue-500" />
												{t('key_1783109429989_as67')}</button>
										)}

										{booking.status !== "PENDING" &&
											booking.status !== "PENDING_APPROVAL" &&
											booking.status !== "AWAITING_PAYMENT" &&
											booking.status !== "CONFIRMED" &&
											!booking.report && (
												<div className="px-4 py-3 text-xs text-muted-foreground italic text-center">
													{t('key_1783109430007_nnup')}</div>
											)}
									</div>
								</>
							)}
						</td>
					</tr>
				)}
			/>

			{hasMore && (
				<div className="flex justify-center p-4 mt-4">
					<button
						onClick={async () => {
							if (isLoadingMore || !nextCursor) return;
							setIsLoadingMore(true);
							try {
								const res = await loadMoreAdminBookings({
									cursor: nextCursor,
									filters: statusFilter !== "ALL" ? { status: statusFilter as BookingStatus } : undefined
								});
								setBookings(prev => [...prev, ...res.data]);
								setHasMore(res.hasMore);
								setNextCursor(res.nextCursor);
							} catch (err) {
								toast.error(t('str_2K3Yr9ir'));
							} finally {
								setIsLoadingMore(false);
							}
						}}
						disabled={isLoadingMore}
						className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
					>
						{isLoadingMore ? tCommon('loading') : t('str_2KrYrdmF')}
					</button>
				</div>
			)}

			{/* Cancel Modal */}
			{showCancelModal && (
				<Portal>
					<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
						<form
							onSubmit={handleCancelSubmit}
							className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl my-8"
						>
							<h3 className="font-extrabold text-lg flex items-center gap-2">
								<XCircle className="h-5 w-5 text-destructive" />
								{t('key_1783109430024_0xkk')}</h3>
							<p className="text-xs text-muted-foreground leading-relaxed">
								بصفتك مدير النظام، فإن إلغاءك لهذا الحجز سيتجاوز شروط الإلغاء
								العادية وسيعتبر نهائياً. سيتم إشعار المعلم وولي الأمر.
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
										setCancelReason("");
										setSelectedBookingId(null);
									}}
									className="text-xs font-semibold border border-border hover:bg-accent px-4 py-2 rounded-lg cursor-pointer"
								>
									{t('key_1783109430052_d4am')}</button>
								<button
									type="submit"
									disabled={loading}
									className="text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
								>
									{loading ? t('str_mr6biltq_2KzYp9') : t('str_2KrZhtmB')}
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
								{t('key_1783109430098_g1w4')}</h3>

							<div className="space-y-4 text-sm">
								<div className="bg-accent/30 p-3 rounded-lg">
									<span className="text-xs font-bold block mb-1">
										{t('key_1783109430118_o4bq')}</span>
									<span
										className={
											selectedReport.studentAttended
												? "text-emerald-600 font-bold"
												: "text-rose-600 font-bold"
										}
									>
										{selectedReport.studentAttended
											? t('str_4pyTINit')
											: t('str_4pyXINi6')}
									</span>
								</div>

								<div>
									<span className="text-xs text-muted-foreground font-bold block mb-1">
										{t('key_1783109430138_uiqs')}</span>
									<p className="bg-card border border-border p-3 rounded-lg whitespace-pre-wrap">
										{selectedReport.topicsCovered}
									</p>
								</div>

								{selectedReport.teacherNotes && (
									<div>
										<span className="text-xs text-muted-foreground font-bold block mb-1">
											{t('key_1783109430162_o6ts')}</span>
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
									{t('key_1783109430185_ctz5')}</button>
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
