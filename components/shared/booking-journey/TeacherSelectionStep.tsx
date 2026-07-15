"use client";
import {
	AlertCircle,
	ChevronLeft,
	GraduationCap,
	MapPin,
	Sparkles,
	Star,
} from "lucide-react";
import { VERIFICATION_BADGES_CONFIG } from "@/lib/translations";
import { cn, formatCurrency } from "@/lib/utils";
import type { AvailableTeacher } from "@/types/booking";
import { useTranslations } from "next-intl";

type TeacherSelectionStepProps = {
	searchQuery: {
		selectedSpec: string;
		selectedDate: string;
		selectedTime: string;
	};
	selectedSubjectLabel: string;
	selectedDateLabel: string;
	selectedTimeLabel: string;
	availableTeachers: AvailableTeacher[];
	setCurrentStep: (step: "search" | "results" | "details") => void;
	handleSelectTeacher: (teacher: AvailableTeacher) => void;
};

export function TeacherSelectionStep({
	searchQuery,
	selectedSubjectLabel,
	selectedDateLabel,
	selectedTimeLabel,
	availableTeachers,
	setCurrentStep,
	handleSelectTeacher,
}: TeacherSelectionStepProps) {
    const t = useTranslations('common');
	return (
		<div className="space-y-4 animate-fadeIn">
			{/* ملخص البحث */}
			<div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
							<Sparkles className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t('ntaej_albhth')}</p>
							<p className="text-sm font-bold">
								{selectedSubjectLabel} — {selectedDateLabel} —{" "}
								{selectedTimeLabel}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => setCurrentStep("search")}
						className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
					>
						<ChevronLeft className="h-3.5 w-3.5" />
						{t('tadyl_albhth')}</button>
				</div>
			</div>

			{availableTeachers.length === 0 ? (
				<div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-3">
					<div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
						<AlertCircle className="h-8 w-8" />
					</div>
					<h3 className="font-bold text-lg">{t('la_ywjd_malmwn_mtahwn')}</h3>
					<p className="text-xs text-muted-foreground max-w-sm mx-auto">
						{t('natthr_la_ywjd_malmwn')}{" "}
						<strong>{selectedSubjectLabel}</strong> {t('fy_alwqt_almhdd_jrb')}</p>
					<button
						type="button"
						onClick={() => setCurrentStep("search")}
						className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer"
					>
						{t('tadyl_maayyr_albhth')}</button>
				</div>
			) : (
				<>
					<p className="text-xs text-muted-foreground font-semibold px-1">
						{t('tm_alathwr_ala')}{" "}
						<span className="text-primary font-bold">
							{availableTeachers.length}
						</span>{" "}
						{t('malm_mtah_akhtr')}</p>

					<div className="space-y-3">
						{availableTeachers.map((teacher) => {
							const badge =
								VERIFICATION_BADGES_CONFIG[
									teacher.verificationLevel as keyof typeof VERIFICATION_BADGES_CONFIG
								] || VERIFICATION_BADGES_CONFIG.NONE;
							const lowestPriceService = teacher.services.reduce((min, s) => s.price < min.price ? s : min, teacher.services[0]);
							const lowestPrice = lowestPriceService?.price ?? 0;
							const lowestCurrency = lowestPriceService?.currency;

							return (
								<button
									key={teacher.id}
									type="button"
									onClick={() => handleSelectTeacher(teacher)}
									className="w-full bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer text-start group"
								>
									<div className="flex gap-4">
										{/* صورة المعلم */}
										<div className="flex-shrink-0">
											<div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-extrabold text-xl border border-primary/10">
												{teacher.profileImageUrl ? (
													<img
														src={teacher.profileImageUrl}
														alt={teacher.userName}
														className="h-14 w-14 rounded-xl object-cover"
													/>
												) : (
													teacher.userName.charAt(0)
												)}
											</div>
										</div>

										{/* تفاصيل المعلم */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="font-bold text-sm truncate">
													{teacher.userName}
												</h4>
												{teacher.verificationLevel !== "NONE" && (
													<span
														className={cn(
															"text-[10px] font-bold px-2 py-0.5 rounded-full",
															badge.colorClass,
														)}
													>
														{badge.icon} {badge.label}
													</span>
												)}
											</div>

											<div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
												{teacher.city && (
													<span className="flex items-center gap-0.5">
														<MapPin className="h-3 w-3" />
														{teacher.city}
													</span>
												)}
												<span className="flex items-center gap-0.5">
													<GraduationCap className="h-3 w-3" />
													{teacher.yearsOfExperience} {t('snh_khbrh')}</span>
												{teacher.averageRating > 0 && (
													<span className="flex items-center gap-0.5">
														<Star className="h-3 w-3 text-amber-500 fill-amber-500" />
														{teacher.averageRating.toFixed(1)}
														<span className="text-muted-foreground/60">
															({teacher.totalReviews})
														</span>
													</span>
												)}
											</div>

											{teacher.bio && (
												<p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
													{teacher.bio}
												</p>
											)}

											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
														{t('ybda_mn')}{formatCurrency(lowestPrice, lowestCurrency)}
													</span>
													<span className="text-[10px] text-muted-foreground">
														{teacher.totalSessions} {t('jlsh_mktmlh')}</span>
												</div>
												<span className="text-[11px] font-bold text-primary group-hover:underline">
													{t('akhtyar')}</span>
											</div>
										</div>
									</div>
								</button>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}
