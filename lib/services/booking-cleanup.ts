import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const ONE_MINUTE_MS = 60_000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60_000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60_000;
const NINETY_SIX_HOURS_MS = 96 * 60 * 60_000;
const TEN_DAYS_MS = 10 * 24 * 60 * 60_000;

export type BookingWithDetails = {
	id: string;
	status: BookingStatus;
	startTime?: Date;
	duration?: number;
	reportWarningLevel?: number;
	parentUserId: string;
	price: any;
	paymentStatus: PaymentStatus;
	isTrial: boolean;
	payment: any;
	teacherService?: {
		teacher: { userId: string };
	};
	_escrowed?: boolean;
	_warning?: boolean;
};

export type CleanupHandler = (booking: BookingWithDetails, tx?: Prisma.TransactionClient) => Promise<void>;

const handlePendingBooking: CleanupHandler = async (booking, externalTx) => {
	const logic = async (tx: Prisma.TransactionClient) => {
		const isPaid = booking.paymentStatus === PaymentStatus.PAID && !booking.isTrial;

		await tx.booking.update({
			where: { id: booking.id },
			data: {
				status: BookingStatus.CANCELLED,
				cancellationReason: "إلغاء تلقائي من النظام: انتهى وقت الجلسة ولم يتم تأكيدها.",
				cancelledAt: new Date(),
				paymentStatus: isPaid ? PaymentStatus.REFUNDED : booking.paymentStatus,
			},
		});

		if (isPaid) {
			if (booking.payment) {
				await tx.payment.update({
					where: { bookingId: booking.id },
					data: { isPaid: false },
				});
			}

			await tx.parentRefund.create({
				data: {
					bookingId: booking.id,
					amount: booking.price,
					isPaid: false,
				},
			});
		}

		await createNotification(
			{
				userId: booking.parentUserId,
				title: "إلغاء حجز تلقائي",
				message: `نعتذر، لقد تم إلغاء جلستك تلقائياً نظراً لانتهاء وقتها دون تأكيد المعلم.${
					isPaid ? " سيتم إرجاع المبلغ المدفوع لرصيدك في أقرب وقت." : ""
				}`,
			},
			tx,
		);
	};

	if (externalTx) await logic(externalTx);
	else await prisma.$transaction(logic);
};

const handleConfirmedBooking: CleanupHandler = async (booking, externalTx) => {
	const now = new Date();
	const WARNING_1_MS = TWENTY_FOUR_HOURS_MS;
	const WARNING_2_MS = FORTY_EIGHT_HOURS_MS;
	const ESCROW_MS = NINETY_SIX_HOURS_MS;

	const startMs = new Date(booking.startTime!).getTime();
	const durationMs = booking.duration! * ONE_MINUTE_MS;
	const endMs = startMs + durationMs;
	const timeSinceEndMs = now.getTime() - endMs;

	if (timeSinceEndMs <= WARNING_1_MS) return;

	const logic = async (tx: Prisma.TransactionClient) => {
		const teacherUserId = booking.teacherService!.teacher.userId;

		if (timeSinceEndMs > ESCROW_MS && booking.reportWarningLevel! < 3) {
			await tx.booking.update({
				where: { id: booking.id },
				data: {
					status: BookingStatus.CANCELLED,
					reportWarningLevel: 3,
					cancellationReason: "تخلف المعلم عن كتابة التقرير للمدة القصوى (96 ساعة). تمت المصادرة.",
					cancelledAt: new Date(),
					paymentStatus:
						booking.paymentStatus === PaymentStatus.PAID && !booking.isTrial
							? PaymentStatus.REFUNDED
							: booking.paymentStatus,
				},
			});

			if (booking.paymentStatus === PaymentStatus.PAID && !booking.isTrial) {
				await tx.adminEscrow.create({
					data: {
						bookingId: booking.id,
						amount: booking.price,
						reason: "مصادرة بسبب عدم تسليم تقرير الجلسة خلال 96 ساعة.",
					},
				});

				if (booking.payment) {
					await tx.payment.update({
						where: { bookingId: booking.id },
						data: { isPaid: false },
					});
				}
			}

			await createNotification(
				{
					userId: teacherUserId,
					title: "إلغاء جلسة ومصادرة الأرباح 🔴",
					message: `تم إغلاق جلستك تلقائياً نظراً لعدم تسليم التقرير لفترة تجاوزت 4 أيام.`,
				},
				tx,
			);

			await createNotification(
				{
					userId: booking.parentUserId,
					title: "إلغاء جلسة لعدم التزام المعلم بالتقرير",
					message: `نعتذر، لم يقم المعلم بكتابة تقرير الجلسة. تم حفظ حقوقك المالية وتُراجع الإدارة الموضوع الآن.`,
				},
				tx,
			);

			booking._escrowed = true;
		} else if (timeSinceEndMs > WARNING_2_MS && booking.reportWarningLevel! < 2) {
			await tx.booking.update({
				where: { id: booking.id },
				data: { reportWarningLevel: 2 },
			});

			await createNotification(
				{
					userId: teacherUserId,
					title: "تحذير نهائي - تجميد أرباح ⚠️",
					message: `أرباح جلستك محجوزة! أمامك وقت محدود لتقديم التقرير قبل مصادرة الجلسة نهائياً.`,
				},
				tx,
			);

			booking._warning = true;
		} else if (timeSinceEndMs > WARNING_1_MS && booking.reportWarningLevel! < 1) {
			await tx.booking.update({
				where: { id: booking.id },
				data: { reportWarningLevel: 1 },
			});

			await createNotification(
				{
					userId: teacherUserId,
					title: "تحذير: تقرير متأخر ⏳",
					message: `لقد مضى 24 ساعة على انتهاء الجلسة ولم تقم بكتابة التقرير. يرجى كتابته فوراً لتجنب تجميد الأرباح.`,
				},
				tx,
			);

			booking._warning = true;
		}
	};

	if (externalTx) await logic(externalTx);
	else await prisma.$transaction(logic);
};

export const CLEANUP_HANDLERS: Partial<Record<BookingStatus, CleanupHandler>> = {
	[BookingStatus.PENDING]: handlePendingBooking,
	[BookingStatus.CONFIRMED]: handleConfirmedBooking,
};

/**
 * دالة موحدة لتنظيف الجلسات المعلقة التي انتهى وقتها (Stale Bookings).
 *
 * @param teacherId - إذا تم توفيره، يتم التنظيف فقط لجلسات هذا المعلم. وإلا يتم التنظيف لكل النظام.
 * @returns number - عدد الجلسات التي تم إلغاؤها بنجاح.
 */
export async function processStaleBookingsCancellation(
	teacherId?: string,
): Promise<number> {
	const now = new Date();

	const staleBookings = await prisma.booking.findMany({
		where: {
			status: BookingStatus.PENDING,
			startTime: { lt: now },
			...(teacherId && {
				teacherService: {
					teacherId,
				},
			}),
		},
		select: {
			id: true,
			status: true,
			parentUserId: true,
			price: true,
			paymentStatus: true,
			isTrial: true,
			payment: true,
		},
	});

	if (staleBookings.length === 0) return 0;

	let cancelledCount = 0;

	await prisma.$transaction(async (tx) => {
		await Promise.all(
			staleBookings.map(async (booking) => {
				try {
					await CLEANUP_HANDLERS[booking.status as BookingStatus]?.(booking as any, tx);
					cancelledCount++;
				} catch (err) {
					console.error(`Failed to cancel stale booking ${booking.id}:`, err);
				}
			})
		);
	});

	return cancelledCount;
}

/**
 * نظام العقوبات المتدرجة للجلسات التي تمت ولم يُكتب لها تقرير (Ghost Bookings)
 */
export async function processGhostBookingsPenalties(): Promise<{
	warningsSent: number;
	escrowedCount: number;
}> {
	const now = new Date();
	const tenDaysAgo = new Date(now.getTime() - TEN_DAYS_MS);

	const confirmedGhostBookings = await prisma.booking.findMany({
		where: {
			status: BookingStatus.CONFIRMED,
			startTime: { gte: tenDaysAgo },
		},
		select: {
			id: true,
			status: true,
			startTime: true,
			duration: true,
			reportWarningLevel: true,
			teacherService: {
				select: { teacher: { select: { userId: true } } },
			},
			parentUserId: true,
			price: true,
			paymentStatus: true,
			isTrial: true,
			payment: true,
		},
	});

	let warningsSent = 0;
	let escrowedCount = 0;

	await prisma.$transaction(async (tx) => {
		await Promise.all(
			confirmedGhostBookings.map(async (booking) => {
				try {
					const b = booking as any;
					await CLEANUP_HANDLERS[b.status as BookingStatus]?.(b, tx);
					
					if (b._escrowed) escrowedCount++;
					if (b._warning) warningsSent++;
				} catch (err) {
					console.error(`Failed to process penalty for booking ${booking.id}:`, err);
				}
			})
		);
	});

	return { warningsSent, escrowedCount };
}
