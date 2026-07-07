"use client";
import { useTranslations } from "next-intl";

import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Save,
	Upload,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateTeacherProfile } from "@/lib/actions/teacher";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { teacherProfileSchema } from "@/lib/validations/teacher";
import { Currency } from "@prisma/client";

type ProfileData = {
	subjectIds: string[];
	subSpecialization: string | null;
	bio: string | null;
	gradeLevels: number[];
	city: string | null;
	area: string | null;
	education: string | null;
	yearsOfExperience: number;
	defaultHourlyRate: number;
	defaultHourlyRateCurrency: Currency;
	profileImageUrl: string | null;
};

type TeacherProfileFormProps = {
	initialData: ProfileData;
	subjects: { id: string; name: string }[];
};

export default function TeacherProfileForm({
	initialData,
	subjects,
}: TeacherProfileFormProps) {
    const t = useTranslations('teachers')
	const router = useRouter();
	const [formData, setFormData] = useState<ProfileData>(initialData);
	const [loading, setLoading] = useState(false);
	const [uploadingImage, setUploadingImage] = useState(false);

	// Stepper state
	const [currentStep, setCurrentStep] = useState(1);
	const totalSteps = 3;

	const availableGrades = Array.from({ length: 12 }).map((_, i) => i + 1);

	const handleGradeToggle = (grade: number) => {
		const current = formData.gradeLevels;
		const updated = current.includes(grade)
			? current.filter((g) => g !== grade)
			: [...current, grade].sort((a, b) => a - b);
		setFormData({ ...formData, gradeLevels: updated });
	};

	const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploadingImage(true);

		const data = new FormData();
		data.append("file", file);
		data.append("bucket", "profiles");

		try {
			const res = await fetch("/api/upload", {
				method: "POST",
				body: data,
			});

			const resData = await res.json();
			setUploadingImage(false);

			if (res.ok && resData.url) {
				setFormData({ ...formData, profileImageUrl: resData.url });
				toast.success(t('profile_success_upload'));
			} else {
				toast.error(t('profile_error_upload'), { description: resData.error });
			}
		} catch (err) {
			toast.error(t('profile_error_title'), {
				description: t('profile_error_upload_connection'),
			});
			setUploadingImage(false);
		}
	};

	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		setLoading(true);

		const validated = teacherProfileSchema.safeParse(formData);
		if (!validated.success) {
			toast.error(t('profile_error_incomplete_title'), {
				description: t('profile_error_incomplete_desc'),
			});
			setLoading(false);
			return;
		}

		const res = await updateTeacherProfile({
			subjectIds: formData.subjectIds,
			subSpecialization: formData.subSpecialization || undefined,
			bio: formData.bio || undefined,
			gradeLevels: formData.gradeLevels,
			city: formData.city || "",
			area: formData.area || undefined,
			education: formData.education || undefined,
			yearsOfExperience: Number(formData.yearsOfExperience),
			defaultHourlyRate: Number(formData.defaultHourlyRate),
			profileImageUrl: formData.profileImageUrl || undefined,
		});

		setLoading(false);

		if (res.success) {
			toast.success(t('profile_success_save_title'), {
				description: t('profile_success_save_desc'),
			});
			router.refresh();
		} else {
			toast.error(t('profile_error_save_title'), { description: res.error });
		}
	};

	const nextStep = () => {
		if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
	};

	const prevStep = () => {
		if (currentStep > 1) setCurrentStep(currentStep - 1);
	};

	return (
		<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden">
			{/* Stepper Header */}
			<div className="bg-muted/30 border-b border-border px-8 py-6">
				<h2 className="font-extrabold text-xl mb-6">{t('profile_setup_title')}</h2>
				<div className="flex items-center justify-between relative">
					<div className="absolute top-1/2 start-0 end-0 h-0.5 bg-border -z-10 -translate-y-1/2" />
					{[1, 2, 3].map((step) => {
						const isActive = step === currentStep;
						const isCompleted = step < currentStep;
						return (
							<div
								key={step}
								className="flex flex-col items-center gap-2 bg-muted/30 px-2 relative z-10"
							>
								<div
									className={cn(
										"w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
										isActive
											? "bg-primary border-primary text-primary-foreground"
											: isCompleted
												? "bg-primary/20 border-primary text-primary"
												: "bg-card border-border text-muted-foreground",
									)}
								>
									{isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step}
								</div>
								<span
									className={cn(
										"text-xs font-semibold",
										isActive || isCompleted
											? "text-foreground"
											: "text-muted-foreground",
									)}
								>
									{step === 1
										? t('profile_tab_personal')
										: step === 2
											? t('profile_tab_experience')
											: t('profile_tab_pricing')}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Form Content */}
			<div className="p-8">
				<div className="min-h-[300px]">
					{/* STEP 1: Personal Info */}
					{currentStep === 1 && (
						<div className="space-y-6 animate-in fade-in slide-in-from-start-4">
							<div className="flex items-center gap-6 flex-wrap mb-6">
								<div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-accent border border-border flex-shrink-0">
									{formData.profileImageUrl ? (
										<Image
											src={formData.profileImageUrl}
											alt="Avatar Preview"
											width={96}
											height={96}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="h-full w-full flex items-center justify-center text-muted-foreground text-3xl font-bold bg-primary/10">
											?
										</div>
									)}
								</div>
								<div>
									<input
										type="file"
										id="avatar"
										accept="image/*"
										onChange={handleUploadImage}
										className="hidden"
									/>
									<label
										htmlFor="avatar"
										className="bg-card border border-border hover:bg-accent text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
									>
										{uploadingImage ? (
											<>
												<Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('profile_uploading')}</>
										) : (
											<>
												<Upload className="h-3.5 w-3.5" /> {t('profile_choose_photo')}</>
										)}
									</label>
									<span className="text-[10px] text-muted-foreground block mt-1">
										{t('profile_photo_format_desc')}</span>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground block">
										{t('profile_city')}</label>
									<input
										type="text"
										required
										value={formData.city || ""}
										onChange={(e) =>
											setFormData({ ...formData, city: e.target.value || null })
										}
										placeholder={t('profile_city_placeholder')}
										className="w-full premium-input text-sm"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground block">
										{t('profile_neighborhood')}</label>
									<input
										type="text"
										value={formData.area || ""}
										onChange={(e) =>
											setFormData({ ...formData, area: e.target.value || null })
										}
										placeholder={t('profile_neighborhood_placeholder')}
										className="w-full premium-input text-sm"
									/>
								</div>
							</div>
						</div>
					)}

					{/* STEP 2: Experience & Specialization */}
					{currentStep === 2 && (
						<div className="space-y-6 animate-in fade-in slide-in-from-start-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground block">
										{t('profile_subjects')}</label>
									<div className="flex flex-wrap gap-2 mt-2">
										{subjects.map((sub) => {
											const isSelected = formData.subjectIds.includes(sub.id);
											return (
												<button
													key={sub.id}
													type="button"
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															subjectIds: isSelected
																? prev.subjectIds.filter((id) => id !== sub.id)
																: [...prev.subjectIds, sub.id],
														}));
													}}
													className={cn(
														"px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
														isSelected
															? "bg-primary text-primary-foreground border-primary"
															: "bg-transparent text-muted-foreground border-input hover:border-primary/50",
													)}
												>
													{sub.name}
												</button>
											);
										})}
									</div>
								</div>

								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground block">
										{t('profile_subspecialization')}</label>
									<input
										type="text"
										value={formData.subSpecialization || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												subSpecialization: e.target.value || null,
											})
										}
										placeholder={t('profile_subspecialization_placeholder')}
										className="w-full premium-input text-sm"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground block">
										{t('profile_education')}</label>
									<input
										type="text"
										value={formData.education || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												education: e.target.value || null,
											})
										}
										placeholder={t('profile_education_placeholder')}
										className="w-full premium-input text-sm"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground block">
										{t('profile_experience')}</label>
									<input
										type="number"
										required
										min={0}
										value={formData.yearsOfExperience}
										onChange={(e) =>
											setFormData({
												...formData,
												yearsOfExperience: Number(e.target.value),
											})
										}
										className="w-full premium-input text-sm"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-xs font-semibold text-muted-foreground block">
									{t('profile_stages')}</label>
								<div className="flex flex-wrap gap-2 pt-1">
									{availableGrades.map((grade) => {
										const isSelected = formData.gradeLevels.includes(grade);
										return (
											<button
												key={grade}
												type="button"
												onClick={() => handleGradeToggle(grade)}
												className={cn(
													"px-4 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer",
													isSelected
														? "bg-primary text-primary-foreground border-primary shadow-sm"
														: "bg-card border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground",
												)}
											>
												{t('profile_grade')}{grade}
											</button>
										);
									})}
								</div>
							</div>
						</div>
					)}

					{/* STEP 3: Pricing & Bio */}
					{currentStep === 3 && (
						<div className="space-y-6 animate-in fade-in slide-in-from-start-4">
							<div className="space-y-1.5 max-w-sm">
								<label className="text-xs font-semibold text-muted-foreground block">
									{t('profile_hourly_rate')}</label>
								<div className="relative">
									<span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
										{getCurrencySymbol(initialData.defaultHourlyRateCurrency)}
									</span>
									<input
										type="number"
										required
										min={5}
										value={formData.defaultHourlyRate}
										onChange={(e) =>
											setFormData({
												...formData,
												defaultHourlyRate: Number(e.target.value),
											})
										}
										className="w-full premium-input text-sm ps-8"
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-muted-foreground block">
									{t('profile_bio')}</label>
								<textarea
									rows={5}
									value={formData.bio || ""}
									onChange={(e) =>
										setFormData({ ...formData, bio: e.target.value || null })
									}
									placeholder={t('profile_bio_placeholder')}
									className="w-full text-sm premium-input resize-none"
								/>
							</div>
						</div>
					)}
				</div>

				{/* Navigation Buttons */}
				<div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
					<button
						type="button"
						onClick={prevStep}
						disabled={currentStep === 1 || loading || uploadingImage}
						className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-0 hover:bg-accent"
					>
						<ChevronRight className="h-4 w-4" />
						{t('profile_btn_prev')}</button>

					{currentStep < totalSteps ? (
						<button
							type="button"
							onClick={nextStep}
							className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
						>
							{t('profile_btn_next')}<ChevronLeft className="h-4 w-4" />
						</button>
					) : (
						<button
							type="button"
							onClick={handleSubmit}
							disabled={loading || uploadingImage}
							className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
						>
							{loading ? (
								<>
									<Loader2 className="h-4.5 w-4.5 animate-spin" /> {t('profile_btn_saving')}</>
							) : (
								<>
									<Save className="h-4.5 w-4.5" /> {t('profile_btn_save')}</>
							)}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
