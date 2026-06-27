import { UserType } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import NewBookingForm from "@/components/shared/NewBookingForm";
import CharacterDialogue from "@/components/shared/booking-journey/CharacterDialogue";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookByTeacherPage() {
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	const userId = session.user.id;

	// 1. Fetch parent's active students list
	const students = await prisma.student.findMany({
		where: { parentUserId: userId, isActive: true },
		select: { id: true, name: true, grade: true },
		orderBy: { name: "asc" },
	});

	// 2. Fetch parent user to check free trial status
	const parentUser = await prisma.user.findUnique({
		where: { id: userId },
		select: { hasUsedFreeTrial: true },
	});

	// 3. Fetch active verified teachers with their services, active schedule availability, and scheduled bookings (to prevent overlap)
	const teachers = await prisma.teacher.findMany({
		where: {
			isVerified: true,
			user: { isActive: true },
		},
		select: {
			id: true,
			userId: true,
			slug: true,
			profileImageUrl: true,
			user: {
				select: { name: true },
			},
			services: {
				where: {
					isActive: true,
					serviceType: { isActive: true },
				},
				select: {
					id: true,
					price: true,
					duration: true,
					serviceType: {
						select: {
							id: true,
							name: true,
							nameEnglish: true,
							defaultDuration: true,
						},
					},
				},
			},
			availability: {
				where: { isActive: true },
				select: { dayOfWeek: true, startTime: true, endTime: true },
			},
			reviews: {
				select: { rating: true },
			},
		},
		orderBy: { user: { name: "asc" } },
	});

	// Fetch scheduled bookings for the next 14 days for these teachers to prevent overlaps
	const fourteenDaysFromNow = new Date();
	fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

	const teacherIds = teachers.map((t) => t.id);

	const bookings = await prisma.booking.findMany({
		where: {
			status: { in: ["PENDING", "CONFIRMED"] },
			startTime: { gte: new Date(), lte: fourteenDaysFromNow },
			teacherService: { teacherId: { in: teacherIds } },
		},
		select: {
			startTime: true,
			duration: true,
			teacherService: {
				select: { teacherId: true },
			},
		},
	});

	// Inject bookings to respective teacher profiles in memory
	const teachersWithBookings = teachers.map((t) => {
		const tutorBookings = bookings
			.filter((b) => b.teacherService.teacherId === t.id)
			.map((b) => ({
				startTime: b.startTime,
				duration: b.duration,
			}));

		return {
			id: t.id,
			userId: t.userId,
			slug: t.slug,
			profileImageUrl: t.profileImageUrl,
			user: { name: t.user.name },
			services: t.services.map((s) => ({
				id: s.id,
				price: Number(s.price),
				duration: s.duration,
				serviceType: s.serviceType,
			})),
			availability: t.availability,
			bookings: tutorBookings,
		};
	});

	return (
		<div className="space-y-4 relative min-h-[500px]" dir="rtl">
			<div className="text-center space-y-1 mb-8">
				<h1 className="text-3xl font-black text-slate-900 dark:text-white">
					حجز جلسة جديدة
				</h1>
				<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
					البحث بالمعلم
				</p>
			</div>

			<div className="max-w-4xl mx-auto space-y-6 pb-20">
				{/* Header with back button and dialogue */}
				<div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
					<Link
						href="/dashboard/parent/bookings/new"
						className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md"
					>
						<ArrowRight className="w-4 h-4" />
						تغيير مسار الحجز
					</Link>

					<div className="flex-1 max-w-lg">
						<CharacterDialogue
							character="najeeb"
							najeebMode="success"
							message="اختيار ممتاز! تصفح قائمة المعلمين، واختر من يلبي طموحك، وأكمل تفاصيل الحجز وسنتولى نحن الباقي."
							align="right"
						/>
					</div>
				</div>

				<NewBookingForm
					students={students}
					teachers={teachersWithBookings}
					hasUsedTrial={parentUser?.hasUsedFreeTrial ?? false}
				/>
			</div>
		</div>
	);
}
