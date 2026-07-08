"use client";

import type { Prisma } from "@prisma/client";
import {
	Award,
	BookOpen,
	CheckCircle2,
	Clock,
	DollarSign,
	ExternalLink,
	FileText,
	GraduationCap,
	Mail,
	MapPin,
	Phone,
	Star,
	User,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import type { commonTeacherInclude } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { useTranslations, useLocale } from "next-intl";

export type DetailedTeacher = Prisma.TeacherGetPayload<{
	include: typeof commonTeacherInclude;
}>;

interface TeacherDetailsProps {
	teacher: DetailedTeacher;
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

export default function TeacherDetails({
	teacher,
	activeTab,
	setActiveTab,
}: TeacherDetailsProps) {
    const t = useTranslations('common');
	const locale = useLocale();
	return (
		<div className="space-y-6">
			{/* Teacher Main Header */}
			<div className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/30 border border-primary/15 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center text-primary border-2 border-primary/25 relative overflow-hidden">
						{teacher.profileImageUrl ? (
							<Image
								src={teacher.profileImageUrl}
								alt={teacher.user.name}
								fill
								className="object-cover"
							/>
						) : (
							<User className="h-8 w-8" />
						)}
					</div>
					<div>
						<h3 className="text-xl font-extrabold text-foreground">
							{t('a')}{teacher.user.name}
						</h3>
						<span className="text-xs text-primary font-bold">
							{teacher.subjects && teacher.subjects.length > 0
								? new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
										teacher.subjects.map((s) => s.subject.name)
								  )
								: teacher.subSpecialization}
						</span>
					</div>
				</div>

				<div className="flex gap-2">
					{teacher.isVerified && (
						<span className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
							<CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
							{t('mwthq')}{teacher.verificationLevel}
						</span>
					)}
				</div>
			</div>

			{/* Grid Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div className="p-4 border border-border bg-accent/10 rounded-xl text-center">
					<Star className="h-5 w-5 text-violet-500 fill-currentColor mx-auto mb-1" />
					<span className="text-[10px] text-muted-foreground block font-bold">
						{t('altqyym')}</span>
					<span className="text-sm font-extrabold text-foreground">
						{Number(teacher.averageRating).toFixed(1)} / 5.0
					</span>
				</div>
				<div className="p-4 border border-border bg-accent/10 rounded-xl text-center">
					<FileText className="h-5 w-5 text-primary mx-auto mb-1" />
					<span className="text-[10px] text-muted-foreground block font-bold">
						{t('alhss_almnfthh')}</span>
					<span className="text-sm font-extrabold text-foreground">
						{teacher.totalSessions} {t('hsh')}</span>
				</div>
				<div className="p-4 border border-border bg-accent/10 rounded-xl text-center">
					<Award className="h-5 w-5 text-primary mx-auto mb-1" />
					<span className="text-[10px] text-muted-foreground block font-bold">
						{t('alkhbrh')}</span>
					<span className="text-sm font-extrabold text-foreground">
						{teacher.yearsOfExperience} {t('snwat')}</span>
				</div>
				<div className="p-4 border border-border bg-accent/10 rounded-xl text-center">
					<DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
					<span className="text-[10px] text-muted-foreground block font-bold">
						{t('alsar_alaftrady')}</span>
					<span className="text-sm font-extrabold text-foreground">
						{teacher.defaultHourlyRate
							? formatCurrency(Number(teacher.defaultHourlyRate), teacher.defaultHourlyRateCurrency)
							: t('ghyr_mhdd')}
					</span>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-2 border-b border-border pb-px">
				<button
					onClick={() => setActiveTab("info")}
					className={cn(
						"pb-3.5 text-xs font-bold border-b-2 px-4 transition-colors cursor-pointer",
						activeTab === "info"
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground",
					)}
				>
					{t('alsyrh_althatyh_walmalwmat')}</button>
				<button
					onClick={() => setActiveTab("services")}
					className={cn(
						"pb-3.5 text-xs font-bold border-b-2 px-4 transition-colors cursor-pointer",
						activeTab === "services"
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground",
					)}
				>
					{t('alkhdmat_alkhswsyh')}{teacher.services.length})
				</button>
				<button
					onClick={() => setActiveTab("reviews")}
					className={cn(
						"pb-3.5 text-xs font-bold border-b-2 px-4 transition-colors cursor-pointer",
						activeTab === "reviews"
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground",
					)}
				>
					{t('araa_wtqyymat_alahaly')}{teacher.reviews.length})
				</button>
			</div>

			{/* Tab Contents */}
			{activeTab === "info" && (
				<div className="space-y-4 text-xs">
					{/* Bio */}
					{teacher.bio && (
						<div className="p-4 border border-border bg-card rounded-xl">
							<span className="font-bold text-primary block mb-2 text-[11px]">
								{t('alnbthh_alshkhsyh')}</span>
							<p className="leading-relaxed text-foreground/80 italic">
								{teacher.bio}
							</p>
						</div>
					)}

					{/* Location & Contact Info */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="p-4 border border-border bg-card rounded-xl space-y-2">
							<span className="font-bold text-primary block mb-1 text-[11px]">
								{t('almwqa_walmstwa_aldrasy')}</span>
							<div className="flex items-center gap-1.5 text-foreground/85">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span>
									{t('almdynh_walmntqh')}{" "}
									<strong>{teacher.city || t('ghyr_mhdd')}</strong>{" "}
									{teacher.area && `(${teacher.area})`}
								</span>
							</div>
							<div className="flex items-center gap-1.5 text-foreground/85">
								<GraduationCap className="h-4 w-4 text-muted-foreground" />
								<span>
									{t('alsfwf_alty_ydrsha')}{" "}
									<strong>
										{teacher.gradeLevels
											?.map((g: number) => t('grade_level', { grade: g }))
											.join(", ") || t('ghyr_mhdd')}
									</strong>
								</span>
							</div>
						</div>

						<div className="p-4 border border-border bg-card rounded-xl space-y-2">
							<span className="font-bold text-primary block mb-1 text-[11px]">
								{t('byanat_alatsal_waltalym')}</span>
							<div className="flex items-center gap-1.5 text-foreground/85">
								<BookOpen className="h-4 w-4 text-muted-foreground" />
								<span>
									{t('almohl_alalmy')}{" "}
									<strong>{teacher.education || t('ghyr_mhdd')}</strong>
								</span>
							</div>
							<div className="flex items-center gap-1.5 text-foreground/85">
								<Mail className="h-4 w-4 text-muted-foreground" />
								<span>
									{t('albryd_alilktrwny_1')}<strong>{teacher.user.email}</strong>
								</span>
							</div>
							{teacher.user.phone && (
								<div className="flex items-center gap-1.5 text-foreground/85">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<span>
										{t('rqm_alhatf_1')}<strong>{teacher.user.phone}</strong>
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Verification Files (Admin Only) */}
					{Object.hasOwn(teacher, "verification") && (
						<div className="p-4 border border-border bg-card rounded-xl space-y-3">
							<span className="font-bold text-primary block border-b border-border pb-1.5 text-[11px]">
								{t('mstndat_althqq_almrfwah_llmdraa')}</span>
							{teacher.verification ? (
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div className="p-3 border border-border bg-accent/15 rounded-xl space-y-1.5 flex flex-col justify-between">
										<span className="font-bold text-[10px] text-muted-foreground block">
											{t('albtaqh_alshkhsyh_hwyh')}</span>
										{teacher.verification.nationalIdUrl ? (
											<a
												href={teacher.verification.nationalIdUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[11px] font-semibold text-primary hover:underline flex items-center justify-between mt-1"
											>
												<span>{t('ard_alhwyh_almrfwah')}</span>
												<ExternalLink className="h-3.5 w-3.5" />
											</a>
										) : (
											<span className="text-[10px] text-rose-500 font-semibold block mt-1">
												{t('ghyr_mrfwah')}</span>
										)}
									</div>

									<div className="p-3 border border-border bg-accent/15 rounded-xl space-y-1.5 flex flex-col justify-between">
										<span className="font-bold text-[10px] text-muted-foreground block">
											{t('alshhadh_aljamayh')}</span>
										{teacher.verification.degreeUrl ? (
											<a
												href={teacher.verification.degreeUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[11px] font-semibold text-primary hover:underline flex items-center justify-between mt-1"
											>
												<span>{t('ard_alshhadh_almrfwah')}</span>
												<ExternalLink className="h-3.5 w-3.5" />
											</a>
										) : (
											<span className="text-[10px] text-rose-500 font-semibold block mt-1">
												{t('ghyr_mrfwah')}</span>
										)}
									</div>

									<div className="p-3 border border-border bg-accent/15 rounded-xl space-y-1.5 flex flex-col justify-between">
										<span className="font-bold text-[10px] text-muted-foreground block">
											{t('alfydyw_altaryfy')}</span>
										{teacher.verification.videoInterviewUrl ? (
											<a
												href={teacher.verification.videoInterviewUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[11px] font-semibold text-primary hover:underline flex items-center justify-between mt-1"
											>
												<span>{t('ard_alfydyw_almrfwa')}</span>
												<ExternalLink className="h-3.5 w-3.5" />
											</a>
										) : (
											<span className="text-[10px] text-muted-foreground block mt-1 italic">
												{t('ghyr_mrfwa')}</span>
										)}
									</div>
								</div>
							) : (
								<p className="text-xs text-muted-foreground italic">
									{t('la_twjd_mstndat_mrfwah')}</p>
							)}
						</div>
					)}
				</div>
			)}

			{activeTab === "services" && (
				<div className="space-y-3">
					{teacher.services.length === 0 ? (
						<p className="text-xs text-muted-foreground py-10 text-center bg-accent/10 border border-border rounded-xl">
							{t('la_twjd_khdmat_khswsyh')}</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{teacher.services.map((srv) => (
								<div
									key={srv.id}
									className="p-4 border border-border bg-card rounded-xl text-xs space-y-2 flex flex-col justify-between"
								>
									<div>
										<h4 className="font-extrabold text-foreground text-sm flex items-center gap-1">
											<BookOpen className="h-4 w-4 text-primary" />
											{srv.serviceType.name}
										</h4>
										{srv.customDescription && (
											<p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
												{srv.customDescription}
											</p>
										)}
									</div>
									<div className="flex justify-between items-center border-t border-border/50 pt-2 mt-2">
										<span className="text-muted-foreground flex items-center gap-1">
											<Clock className="h-3.5 w-3.5" />
											{srv.duration} {t('dqyqh')}</span>
										<span className="font-extrabold text-primary text-sm">
											{formatCurrency(Number(srv.price), srv.currency)}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{activeTab === "reviews" && (
				<div className="space-y-3 max-h-[40vh] overflow-y-auto pe-1">
					{teacher.reviews.length === 0 ? (
						<p className="text-xs text-muted-foreground py-10 text-center bg-accent/10 border border-border rounded-xl">
							{t('la_twjd_tqyymat_mktwbh')}</p>
					) : (
						teacher.reviews.map((rev) => (
							<div
								key={rev.id}
								className="p-4 border border-border bg-card rounded-xl text-xs space-y-2"
							>
								<div className="flex justify-between items-center">
									<span className="font-bold text-foreground">
										{rev.booking.student.name || t('wly_amr')}
									</span>
									<div className="flex items-center gap-0.5">
										{[1, 2, 3, 4, 5].map((s) => (
											<Star
												key={s}
												size={12}
												fill={s <= rev.rating ? "currentColor" : "none"}
												className={
													s <= rev.rating
														? "text-violet-500"
														: "text-muted-foreground/35"
												}
											/>
										))}
									</div>
								</div>
								{rev.comment && (
									<p className="text-muted-foreground leading-relaxed">
										{rev.comment}
									</p>
								)}
								<span className="text-[10px] text-muted-foreground/50 block mt-1">
									{t('tarykh_altqyym')}{" "}
									{new Date(rev.createdAt).toLocaleDateString("ar-EG")}
								</span>
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
}
