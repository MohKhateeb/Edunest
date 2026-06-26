"use client";

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
import { cn, formatPrice } from "@/lib/utils";

interface TeacherDetailsProps {
	teacher: any;
	activeTab: string;
	setActiveTab: (tab: any) => void;
}

export default function TeacherDetails({
	teacher,
	activeTab,
	setActiveTab,
}: TeacherDetailsProps) {
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
							أ. {teacher.user.name}
						</h3>
						<span className="text-xs text-primary font-bold">
							{teacher.subjects && teacher.subjects.length > 0
								? teacher.subjects.map((s: any) => s.subject.name).join("، ")
								: teacher.specialization}
						</span>
					</div>
				</div>

				<div className="flex gap-2">
					{teacher.isVerified && (
						<span className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
							<CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
							موثق {teacher.verificationLevel}
						</span>
					)}
				</div>
			</div>

			{/* Grid Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div className="p-4 border border-border bg-accent/10 rounded-xl text-center">
					<Star className="h-5 w-5 text-violet-500 fill-currentColor mx-auto mb-1" />
					<span className="text-[10px] text-muted-foreground block font-bold">
						التقييم
					</span>
					<span className="text-sm font-extrabold text-foreground">
						{Number(teacher.averageRating).toFixed(1)} / 5.0
					</span>
				</div>
				<div className="p-4 border border-border bg-accent/10 rounded-xl text-center">
					<FileText className="h-5 w-5 text-primary mx-auto mb-1" />
					<span className="text-[10px] text-muted-foreground block font-bold">
						الحصص المنفذة
					</span>
					<span className="text-sm font-extrabold text-foreground">
						{teacher.totalSessions} حصة
					</span>
				</div>
				<div className="p-4 border border-border bg-accent/10 rounded-xl text-center">
					<Award className="h-5 w-5 text-primary mx-auto mb-1" />
					<span className="text-[10px] text-muted-foreground block font-bold">
						الخبرة
					</span>
					<span className="text-sm font-extrabold text-foreground">
						{teacher.yearsOfExperience} سنوات
					</span>
				</div>
				<div className="p-4 border border-border bg-accent/10 rounded-xl text-center">
					<DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
					<span className="text-[10px] text-muted-foreground block font-bold">
						السعر الافتراضي
					</span>
					<span className="text-sm font-extrabold text-foreground">
						{teacher.defaultHourlyRate
							? formatPrice(Number(teacher.defaultHourlyRate))
							: "غير محدد"}
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
					السيرة الذاتية والمعلومات
				</button>
				<button
					onClick={() => setActiveTab("services")}
					className={cn(
						"pb-3.5 text-xs font-bold border-b-2 px-4 transition-colors cursor-pointer",
						activeTab === "services"
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground",
					)}
				>
					الخدمات الخصوصية ({teacher.services.length})
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
					آراء وتقييمات الأهالي ({teacher.reviews.length})
				</button>
			</div>

			{/* Tab Contents */}
			{activeTab === "info" && (
				<div className="space-y-4 text-xs">
					{/* Bio */}
					{teacher.bio && (
						<div className="p-4 border border-border bg-card rounded-xl">
							<span className="font-bold text-primary block mb-2 text-[11px]">
								النبذة الشخصية:
							</span>
							<p className="leading-relaxed text-foreground/80 italic">
								{teacher.bio}
							</p>
						</div>
					)}

					{/* Location & Contact Info */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="p-4 border border-border bg-card rounded-xl space-y-2">
							<span className="font-bold text-primary block mb-1 text-[11px]">
								الموقع والمستوى الدراسي:
							</span>
							<div className="flex items-center gap-1.5 text-foreground/85">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span>
									المدينة والمنطقة:{" "}
									<strong>{teacher.city || "غير محدد"}</strong>{" "}
									{teacher.area && `(${teacher.area})`}
								</span>
							</div>
							<div className="flex items-center gap-1.5 text-foreground/85">
								<GraduationCap className="h-4 w-4 text-muted-foreground" />
								<span>
									الصفوف التي يدرسها:{" "}
									<strong>
										{teacher.gradeLevels
											?.map((g: number) => `الصف ${g}`)
											.join(", ") || "غير محدد"}
									</strong>
								</span>
							</div>
						</div>

						<div className="p-4 border border-border bg-card rounded-xl space-y-2">
							<span className="font-bold text-primary block mb-1 text-[11px]">
								بيانات الاتصال والتعليم:
							</span>
							<div className="flex items-center gap-1.5 text-foreground/85">
								<BookOpen className="h-4 w-4 text-muted-foreground" />
								<span>
									المؤهل العلمي:{" "}
									<strong>{teacher.education || "غير محدد"}</strong>
								</span>
							</div>
							<div className="flex items-center gap-1.5 text-foreground/85">
								<Mail className="h-4 w-4 text-muted-foreground" />
								<span>
									البريد الإلكتروني: <strong>{teacher.user.email}</strong>
								</span>
							</div>
							{teacher.user.phone && (
								<div className="flex items-center gap-1.5 text-foreground/85">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<span>
										رقم الهاتف: <strong>{teacher.user.phone}</strong>
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Verification Files (Admin Only) */}
					{Object.hasOwn(teacher, "verification") && (
						<div className="p-4 border border-border bg-card rounded-xl space-y-3">
							<span className="font-bold text-primary block border-b border-border pb-1.5 text-[11px]">
								مستندات التحقق المرفوعة (للمدراء فقط):
							</span>
							{teacher.verification ? (
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div className="p-3 border border-border bg-accent/15 rounded-xl space-y-1.5 flex flex-col justify-between">
										<span className="font-bold text-[10px] text-muted-foreground block">
											البطاقة الشخصية (هوية)
										</span>
										{teacher.verification.nationalIdUrl ? (
											<a
												href={teacher.verification.nationalIdUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[11px] font-semibold text-primary hover:underline flex items-center justify-between mt-1"
											>
												<span>عرض الهوية المرفوعة</span>
												<ExternalLink className="h-3.5 w-3.5" />
											</a>
										) : (
											<span className="text-[10px] text-rose-500 font-semibold block mt-1">
												غير مرفوعة
											</span>
										)}
									</div>

									<div className="p-3 border border-border bg-accent/15 rounded-xl space-y-1.5 flex flex-col justify-between">
										<span className="font-bold text-[10px] text-muted-foreground block">
											الشهادة الجامعية
										</span>
										{teacher.verification.degreeUrl ? (
											<a
												href={teacher.verification.degreeUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[11px] font-semibold text-primary hover:underline flex items-center justify-between mt-1"
											>
												<span>عرض الشهادة المرفوعة</span>
												<ExternalLink className="h-3.5 w-3.5" />
											</a>
										) : (
											<span className="text-[10px] text-rose-500 font-semibold block mt-1">
												غير مرفوعة
											</span>
										)}
									</div>

									<div className="p-3 border border-border bg-accent/15 rounded-xl space-y-1.5 flex flex-col justify-between">
										<span className="font-bold text-[10px] text-muted-foreground block">
											الفيديو التعريفي
										</span>
										{teacher.verification.videoInterviewUrl ? (
											<a
												href={teacher.verification.videoInterviewUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[11px] font-semibold text-primary hover:underline flex items-center justify-between mt-1"
											>
												<span>عرض الفيديو المرفوع</span>
												<ExternalLink className="h-3.5 w-3.5" />
											</a>
										) : (
											<span className="text-[10px] text-muted-foreground block mt-1 italic">
												غير مرفوع
											</span>
										)}
									</div>
								</div>
							) : (
								<p className="text-xs text-muted-foreground italic">
									لا توجد مستندات مرفوعة لهذا المعلم حالياً (تم توثيقه مباشرة من
									الإدارة أو لم يقم برفع وثائقه بعد).
								</p>
							)}
						</div>
					)}
				</div>
			)}

			{activeTab === "services" && (
				<div className="space-y-3">
					{teacher.services.length === 0 ? (
						<p className="text-xs text-muted-foreground py-10 text-center bg-accent/10 border border-border rounded-xl">
							لا توجد خدمات خصوصية مضافة لهذا المعلم.
						</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{teacher.services.map((srv: any) => (
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
											{srv.duration} دقيقة
										</span>
										<span className="font-extrabold text-primary text-sm">
											{formatPrice(Number(srv.price))}
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
							لا توجد تقييمات مكتوبة لهذا المعلم بعد.
						</p>
					) : (
						teacher.reviews.map((rev: any) => (
							<div
								key={rev.id}
								className="p-4 border border-border bg-card rounded-xl text-xs space-y-2"
							>
								<div className="flex justify-between items-center">
									<span className="font-bold text-foreground">
										{rev.booking.student.name || "ولي أمر"}
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
									تاريخ التقييم:{" "}
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
