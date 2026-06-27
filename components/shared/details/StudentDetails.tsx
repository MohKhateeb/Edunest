"use client";

import {
	Calendar,
	Clock,
	FileText,
	GraduationCap,
	School,
	Star,
	User,
} from "lucide-react";
import React from "react";
import { BOOKING_STATUS_AR } from "@/lib/translations";
import { cn, formatLocalTime, formatPrice } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import type { commonStudentInclude } from "@/lib/types";

export type DetailedStudent = Prisma.StudentGetPayload<{ include: typeof commonStudentInclude }>;

interface StudentDetailsProps {
	student: DetailedStudent;
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

export default function StudentDetails({
	student,
	activeTab,
	setActiveTab,
}: StudentDetailsProps) {
	// Calculate average rating performance from completed reports
	const completedReports = student.bookings
		.filter(
			(b) => b.status === "COMPLETED" && b.report?.studentPerformance,
		)
		.map((b) => b.report!.studentPerformance!);

	const avgPerformance =
		completedReports.length > 0
			? (
					completedReports.reduce((a: number, b: number) => a + b, 0) /
					completedReports.length
				).toFixed(1)
			: null;

	return (
		<div className="space-y-6">
			{/* Student Badge Card */}
			<div className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/30 border border-primary/15 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center gap-4">
					<div className="p-3.5 bg-primary text-primary-foreground rounded-2xl">
						<GraduationCap className="h-8 w-8" />
					</div>
					<div>
						<h3 className="text-xl font-extrabold text-foreground">
							{student.name}
						</h3>
						<div className="flex flex-wrap gap-2 mt-1">
							<span className="text-[10px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">
								الصف الدراسي {student.grade}
							</span>
							{student.school && (
								<span className="text-[10px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
									<School className="h-3 w-3" />
									{student.school}
								</span>
							)}
						</div>
					</div>
				</div>

				{avgPerformance && (
					<div className="text-left sm:text-right bg-violet-500/10 border border-violet-500/20 px-4 py-2.5 rounded-xl">
						<span className="text-[10px] text-muted-foreground block font-bold">
							مستوى الأداء الدراسي
						</span>
						<div className="flex items-center gap-1 mt-0.5 justify-end">
							<Star className="h-4 w-4 text-violet-500 fill-currentColor" />
							<span className="font-extrabold text-violet-600 dark:text-violet-400 text-sm">
								{avgPerformance} / 5.0
							</span>
							<span className="text-[10px] text-muted-foreground">
								({completedReports.length} تقارير)
							</span>
						</div>
					</div>
				)}
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
					البيانات الأساسية لولي الأمر
				</button>
				<button
					onClick={() => setActiveTab("history")}
					className={cn(
						"pb-3.5 text-xs font-bold border-b-2 px-4 transition-colors cursor-pointer",
						activeTab === "history"
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground",
					)}
				>
					سجل الحصص والجلسات ({student.bookings.length})
				</button>
			</div>

			{/* Tab Contents */}
			{activeTab === "info" && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-5 border border-border bg-accent/10 rounded-xl space-y-3">
						<h4 className="font-extrabold text-sm border-b border-border/50 pb-2 flex items-center gap-1.5 text-primary">
							<User className="h-4.5 w-4.5" />
							بيانات ولي الأمر المسئول
						</h4>
						<div className="text-xs space-y-2">
							<div className="flex justify-between">
								<span className="text-muted-foreground font-semibold">
									الاسم الكامل:
								</span>
								<span className="font-bold text-foreground">
									{student.parent.name}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground font-semibold">
									البريد الإلكتروني:
								</span>
								<span className="font-bold text-foreground">
									{student.parent.email}
								</span>
							</div>
							{student.parent.phone && (
								<div className="flex justify-between">
									<span className="text-muted-foreground font-semibold">
										رقم الجوال:
									</span>
									<span className="font-bold text-foreground">
										{student.parent.phone}
									</span>
								</div>
							)}
						</div>
					</div>

					<div className="p-5 border border-border bg-accent/10 rounded-xl space-y-3">
						<h4 className="font-extrabold text-sm border-b border-border/50 pb-2 flex items-center gap-1.5 text-primary">
							<Clock className="h-4.5 w-4.5" />
							بيانات النظام
						</h4>
						<div className="text-xs space-y-2">
							<div className="flex justify-between">
								<span className="text-muted-foreground font-semibold">
									تاريخ التسجيل بالمنصة:
								</span>
								<span className="font-bold text-foreground">
									{new Date(student.createdAt).toLocaleDateString("ar-EG")}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground font-semibold">
									حالة الحساب:
								</span>
								<span
									className={cn(
										"font-bold text-xs",
										student.isActive ? "text-emerald-600" : "text-rose-500",
									)}
								>
									{student.isActive ? "نشط ومؤهل للحجز" : "غير نشط"}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{activeTab === "history" && (
				<div className="space-y-4">
					{student.bookings.length === 0 ? (
						<p className="text-xs text-muted-foreground py-10 text-center bg-accent/10 border border-border rounded-xl">
							لا توجد حجوزات مسجلة لهذا الطالب بعد.
						</p>
					) : (
						<div className="space-y-3 max-h-[40vh] overflow-y-auto pe-1">
							{student.bookings.map((booking) => (
								<div
									key={booking.id}
									className="p-4 border border-border bg-card hover:bg-accent/10 rounded-xl transition-colors flex flex-col md:flex-row justify-between gap-3 text-xs"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-bold text-foreground text-sm">
												{booking.teacherService.serviceType.name}
											</span>
											<span
												className={cn(
													"px-2 py-0.5 rounded-full text-[10px] font-bold border",
													booking.status === "CONFIRMED" &&
														"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800",
													booking.status === "PENDING" &&
														"bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800",
													booking.status === "COMPLETED" &&
														"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
													booking.status === "CANCELLED" &&
														"bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
													booking.status === "REJECTED" &&
														"bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800",
												)}
											>
												{
													BOOKING_STATUS_AR[
														booking.status as keyof typeof BOOKING_STATUS_AR
													]
												}
											</span>
										</div>
										<p className="text-muted-foreground">
											المعلم:{" "}
											<strong className="text-foreground">
												{booking.teacherService.teacher.user.name}
											</strong>
										</p>
										<div className="flex items-center gap-4 text-muted-foreground text-[10px] pt-1">
											<span className="flex items-center gap-1">
												<Calendar className="h-3.5 w-3.5" />
												{formatLocalTime(booking.startTime)}
											</span>
											<span className="flex items-center gap-1">
												<Clock className="h-3.5 w-3.5" />
												{booking.duration} دقيقة
											</span>
										</div>
									</div>

									<div className="text-right flex flex-col justify-between items-end gap-2">
										<span className="font-extrabold text-primary block">
											{booking.isTrial
												? "تجريبية مجانية"
												: formatPrice(Number(booking.price))}
										</span>
										{booking.status === "COMPLETED" && booking.report && (
											<div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 text-[10px]">
												<FileText className="h-3 w-3" />
												<span>التقرير متوفر</span>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
