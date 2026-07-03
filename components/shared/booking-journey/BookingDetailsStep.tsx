import {
	AlertCircle,
	Award,
	BookCheck,
	BookOpen,
	ChevronLeft,
	Loader2,
	User,
} from "lucide-react";
import { SERVICES } from "@/lib/translations";
import type { AvailableTeacher, Student } from "@/types/booking";
import { useTranslations } from "next-intl";

type BookingDetailsStepProps = {
	bookingDetails: {
		selectedTeacher: AvailableTeacher | null;
		selectedServiceId: string;
		isTrial: boolean;
		parentNotes: string;
		questionTitle: string;
		questionDetails: string;
		questionImageUrl: string;
	};
	handleBookingChange: (name: string, value: string | boolean) => void;
	handleBookingSubmit: (e: React.FormEvent) => Promise<void>;
	setCurrentStep: (step: "search" | "results" | "details") => void;
	searchQuery: {
		selectedStudentId: string;
		selectedSpec: string;
		selectedDate: string;
		selectedTime: string;
	};
	selectedSubjectLabel: string;
	selectedDateLabel: string;
	selectedTimeLabel: string;
	students: Student[];
	hasUsedTrial: boolean;
	errorMsg: string | null;
	loading: boolean;
};

export function BookingDetailsStep({
	bookingDetails,
	handleBookingChange,
	handleBookingSubmit,
	setCurrentStep,
	searchQuery,
	selectedSubjectLabel,
	selectedDateLabel,
	selectedTimeLabel,
	students,
	hasUsedTrial,
	errorMsg,
	loading,
}: BookingDetailsStepProps) {
    const t = useTranslations('common');
	const activeService = bookingDetails.selectedTeacher?.services.find(
		(s) => s.id === bookingDetails.selectedServiceId,
	);

	if (!bookingDetails.selectedTeacher) return null;

	const selectedStudent = students.find((s) => s.id === searchQuery.selectedStudentId);

	return (
		<div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 animate-fadeIn">
			<div className="flex items-center justify-between border-b border-border pb-3">
				<h2 className="font-extrabold text-xl flex items-center gap-2">
					<BookCheck className="h-5 w-5 text-primary" />
					{t('takyd_byanat_alhjz')}</h2>
				<button
					type="button"
					onClick={() => setCurrentStep("results")}
					className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
				>
					<ChevronLeft className="h-3.5 w-3.5" />
					{t('alawdh_llntaej')}</button>
			</div>

			{/* ملخص المعلم والوقت المختار */}
			<div className="bg-accent/30 border border-border rounded-xl p-4 space-y-2">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/10">
						{bookingDetails.selectedTeacher.profileImageUrl ? (
							<img
								src={bookingDetails.selectedTeacher.profileImageUrl}
								alt={bookingDetails.selectedTeacher.userName}
								className="h-10 w-10 rounded-lg object-cover"
							/>
						) : (
							bookingDetails.selectedTeacher.userName.charAt(0)
						)}
					</div>
					<div>
						<p className="text-sm font-bold flex items-center gap-1.5">
							{bookingDetails.selectedTeacher.userName}
							{bookingDetails.selectedTeacher.verificationLevel !== "NONE" && (
								<Award className="h-3.5 w-3.5 text-primary" />
							)}
						</p>
						<p className="text-[11px] text-muted-foreground">
							{selectedSubjectLabel} — {selectedDateLabel} —{" "}
							{selectedTimeLabel}
						</p>
					</div>
				</div>
			</div>

			{errorMsg && (
				<div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
					<AlertCircle className="h-4 w-4" />
					<span>{errorMsg}</span>
				</div>
			)}

			<form onSubmit={handleBookingSubmit} className="space-y-5">
				{/* بيانات الطالب (للعرض فقط) */}
				<div className="space-y-1.5">
					<label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
						<User className="h-4 w-4" />
						{t('altalb_almsthdf')}</label>
					<div className="w-full premium-input text-xs bg-muted/50 cursor-not-allowed">
						{selectedStudent ? `${selectedStudent.name} (الصف ${selectedStudent.grade})` : t('lm_ytm_thdyd_altalb')}
					</div>
				</div>

				{/* اختيار الخدمة */}
				<div className="space-y-1.5">
					<label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
						<BookOpen className="h-4 w-4" />
						{t('nwa_alkhdmh_almtlwbh')}</label>
					<select
						value={bookingDetails.selectedServiceId}
						onChange={(e) =>
							handleBookingChange("selectedServiceId", e.target.value)
						}
						className="w-full premium-input text-xs"
					>
						{bookingDetails.selectedTeacher.services.map((s) => (
							<option key={s.id} value={s.id}>
								{s.serviceTypeName} {t('alsar')}{s.price} {t('shykl')}{s.duration} {t('dqyqh_1')}</option>
						))}
					</select>
				</div>

				{/* خيار الجلسة المجانية */}
				{!hasUsedTrial && (
					<div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900">
						<input
							type="checkbox"
							id="trial-time"
							checked={bookingDetails.isTrial}
							onChange={(e) => handleBookingChange("isTrial", e.target.checked)}
							className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
						/>
						<label
							htmlFor="trial-time"
							className="text-xs font-bold text-purple-800 dark:text-purple-300 cursor-pointer"
						>
							{t('hl_trghb_fy_hjz')}</label>
					</div>
				)}

				{/* حقول السؤال السريع */}
				{activeService?.serviceTypeName === SERVICES.QUICK_HELP && (
					<div className="bg-accent/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn">
						<h3 className="text-xs font-bold text-primary">
							{t('byanat_almsalh_alsryah_almtlwb')}</h3>

						<div className="space-y-1">
							<label className="text-[11px] font-semibold text-muted-foreground block">
								{t('anwan_alsoal_almsalh')}</label>
							<input
								type="text"
								name="questionTitle"
								required
								value={bookingDetails.questionTitle}
								onChange={(e) =>
									handleBookingChange("questionTitle", e.target.value)
								}
								placeholder={t('mthal_hl_maadlh_tfadlyh')}
								className="w-full premium-input text-xs"
							/>
						</div>

						<div className="space-y-1">
							<label className="text-[11px] font-semibold text-muted-foreground block">
								{t('tfasyl_almsalh_aw_alwajb')}</label>
							<textarea
								name="questionDetails"
								required
								rows={3}
								value={bookingDetails.questionDetails}
								onChange={(e) =>
									handleBookingChange("questionDetails", e.target.value)
								}
								placeholder={t('aktb_tfasyl_almsalh_alhsabyh')}
								className="w-full premium-input text-xs resize-none"
							/>
						</div>
					</div>
				)}

				{/* ملاحظات */}
				<div className="space-y-1.5">
					<label className="text-xs font-bold text-muted-foreground">
						{t('mlahdhat_idafyh_llmalm_akhtyary')}</label>
					<textarea
						name="parentNotes"
						rows={2}
						value={bookingDetails.parentNotes}
						onChange={(e) => handleBookingChange("parentNotes", e.target.value)}
						placeholder={t('ay_mlahdhat_aw_tfasyl')}
						className="w-full text-xs premium-input resize-none"
					/>
				</div>

				{/* زر التأكيد */}
				<div className="border-t border-border pt-4">
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
					>
						{loading ? (
							<>
								<Loader2 className="h-4.5 w-4.5 animate-spin" />
								{t('jary_maaljh_whfdh_alhjz')}</>
						) : (
							t('takyd_tlb_hjz_aljlsh')
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
