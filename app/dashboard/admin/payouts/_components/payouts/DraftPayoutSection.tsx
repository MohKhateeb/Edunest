import {
	AlertCircle,
	BadgeDollarSign,
	Calculator,
	CheckCircle2,
	CheckSquare,
	Loader2,
	Search,
	Square,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { TeacherGroup } from "./PendingTeachersList";

type DraftPayoutSectionProps = {
	selectedTeacherGroup: TeacherGroup;
	selectedBookingIds: Set<string>;
	setSelectedBookingIds: (ids: Set<string>) => void;
	handleToggleBooking: (bookingId: string) => void;
	draftResult: {
		bookingCount: number;
		totalAmount: number;
		commissionAmount: number;
		trialCompensation: number;
		netAmount: number;
	} | null;
	handleIssuePayout: () => void;
	loading: boolean;
	errorMsg: string | null;
	successMsg: string | null;
};

export function DraftPayoutSection({
	selectedTeacherGroup,
	selectedBookingIds,
	setSelectedBookingIds,
	handleToggleBooking,
	draftResult,
	handleIssuePayout,
	loading,
	errorMsg,
	successMsg,
}: DraftPayoutSectionProps) {
	return (
		<div className="animate-in fade-in slide-in-from-top-4 duration-500">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
				{/* Left Column: Bookings List */}
				<div className="lg:col-span-2 space-y-4">
					<div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
						<div className="flex justify-between items-center mb-5 pb-4 border-b border-border">
							<h3 className="font-bold flex items-center gap-2">
								<Search className="w-5 h-5 text-orange-500" />
								تفاصيل الحصص للمعلم: {selectedTeacherGroup.teacherName}
							</h3>
							<div className="flex items-center gap-2 text-sm">
								<button
									type="button"
									onClick={() =>
										setSelectedBookingIds(
											new Set(selectedTeacherGroup.bookings.map((b) => b.id)),
										)
									}
									className="text-primary hover:underline font-medium text-xs"
								>
									تحديد الكل
								</button>
								<span className="text-muted-foreground">|</span>
								<button
									type="button"
									onClick={() => setSelectedBookingIds(new Set())}
									className="text-muted-foreground hover:text-foreground font-medium text-xs"
								>
									إلغاء التحديد
								</button>
							</div>
						</div>

						<div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
							{selectedTeacherGroup.bookings.map((b) => (
								<div
									key={b.id}
									onClick={() => handleToggleBooking(b.id)}
									className={cn(
										"flex items-center p-4 rounded-xl border transition-colors cursor-pointer",
										selectedBookingIds.has(b.id)
											? "border-primary/40 bg-primary/5"
											: "border-border bg-card hover:bg-accent/30",
									)}
								>
									<div className="flex-1 space-y-1">
										<div className="flex items-center justify-between">
											<span className="font-bold text-sm">{b.serviceName}</span>
											<span className="font-semibold text-sm">
												{b.isTrial ? (
													<span className="text-purple-600 dark:text-purple-400">
														مجانية ({formatPrice(b.trialCostToPlatform)})
													</span>
												) : (
													<span>{formatPrice(b.price)}</span>
												)}
											</span>
										</div>
										<div className="flex items-center justify-between text-xs text-muted-foreground">
											<span>الطالب: {b.studentName}</span>
											<span>
												{new Date(b.startTime).toLocaleDateString("ar-EG")} -{" "}
												{b.duration} دقيقة
											</span>
										</div>
									</div>
									<div className="mr-4 pr-4 border-r border-border/50 shrink-0">
										{selectedBookingIds.has(b.id) ? (
											<CheckSquare className="w-6 h-6 text-primary" />
										) : (
											<Square className="w-6 h-6 text-muted-foreground" />
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Right Column: Draft Summary */}
				<div className="lg:col-span-1">
					<div className="bg-gradient-to-b from-card to-accent/20 border border-border rounded-2xl p-6 shadow-sm sticky top-6">
						<h3 className="font-bold text-base mb-6 flex items-center gap-2">
							<Calculator className="w-5 h-5 text-primary" />
							مسودة التسوية
						</h3>

						{draftResult ? (
							<div className="space-y-4">
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground">الحصص المحددة:</span>
									<span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
										{draftResult.bookingCount}
									</span>
								</div>
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground">إجمالي الرسوم:</span>
									<span className="font-bold">
										{formatPrice(draftResult.totalAmount)}
									</span>
								</div>
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground">
										عمولة المنصة (-):
									</span>
									<span className="font-bold text-rose-600 dark:text-rose-400">
										-{formatPrice(draftResult.commissionAmount)}
									</span>
								</div>
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground">
										تعويضات مجانية (+):
									</span>
									<span className="font-bold text-purple-600 dark:text-purple-400">
										+{formatPrice(draftResult.trialCompensation)}
									</span>
								</div>

								<div className="pt-4 border-t border-border mt-2">
									<div className="flex justify-between items-center">
										<span className="font-bold text-foreground">
											الصافي المستحق:
										</span>
										<span className="font-extrabold text-xl text-primary">
											{formatPrice(draftResult.netAmount)}
										</span>
									</div>
								</div>

								{errorMsg && (
									<div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20 mt-4">
										<AlertCircle className="h-4 w-4 shrink-0" />
										<span>{errorMsg}</span>
									</div>
								)}

								{successMsg && (
									<div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 mt-4">
										<CheckCircle2 className="h-4 w-4 shrink-0" />
										<span>{successMsg}</span>
									</div>
								)}

								<button
									type="button"
									onClick={handleIssuePayout}
									disabled={loading || draftResult.bookingCount === 0}
									className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
								>
									{loading ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										<BadgeDollarSign className="w-5 h-5" />
									)}
									{loading ? "جاري الإصدار..." : "إصدار التسوية الآن"}
								</button>
							</div>
						) : (
							<div className="text-center py-10 text-muted-foreground text-sm">
								يرجى تحديد حصص لحساب مسودة التسوية
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
