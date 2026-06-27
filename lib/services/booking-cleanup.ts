import { BookingStatus, PaymentStatus } from "@prisma/client";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

/**
 * دالة موحدة لتنظيف الجلسات المعلقة التي انتهى وقتها (Stale Bookings).
 * تحافظ على مبدأ DRY لكي نستخدمها في الـ Cron Job وفي التحميل اللحظي JIT.
 * والأهم: تحافظ على الأموال (Financial Safety) عبر إصدار رد مالي تلقائي إذا كانت الجلسة مدفوعة مسبقاً.
 *
 * @param teacherId - إذا تم توفيره، يتم التنظيف فقط لجلسات هذا المعلم. وإلا يتم التنظيف لكل النظام.
 * @returns number - عدد الجلسات التي تم إلغاؤها بنجاح.
 */
export async function processStaleBookingsCancellation(
	teacherId?: string,
): Promise<number> {
	const now = new Date();

	// 1. البحث عن كل الجلسات المعلقة التي مضى وقتها
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
			parentUserId: true,
			price: true,
			paymentStatus: true,
			isTrial: true,
			payment: true,
		},
	});

	if (staleBookings.length === 0) return 0;

	let cancelledCount = 0;

	// 2. إلغاء الجلسات وحفظ الحقوق المالية داخل Transaction لكل جلسة لضمان عزل الأخطاء
	for (const booking of staleBookings) {
		try {
			await prisma.$transaction(async (tx) => {
				const isPaid =
					booking.paymentStatus === PaymentStatus.PAID && !booking.isTrial;

				// تحديث الحجز
				await tx.booking.update({
					where: { id: booking.id },
					data: {
						status: BookingStatus.CANCELLED,
						cancellationReason:
							"إلغاء تلقائي من النظام: انتهى وقت الجلسة ولم يتم تأكيدها.",
						cancelledAt: new Date(),
						paymentStatus: isPaid
							? PaymentStatus.REFUNDED
							: booking.paymentStatus,
					},
				});

				// إذا كان مدفوعاً، أرجع المال (Refund)
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
							isPaid: false, // لم يتم إرجاعه للبنك فعلياً بعد، بل كأرصدة أو قيد المعالجة الإدارية
						},
					});
				}

				// إرسال إشعار لولي الأمر بالاعتذار
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
			});

			cancelledCount++;
		} catch (err) {
			console.error(`Failed to cancel stale booking ${booking.id}:`, err);
		}
	}

	return cancelledCount;
}

/**
 * نظام العقوبات المتدرجة للجلسات التي تمت ولم يُكتب لها تقرير (Ghost Bookings)
 *
 * 1. بعد 24 ساعة: تحذير أول
 * 2. بعد 48 ساعة: تحذير نهائي وتجميد للرصيد
 * 3. بعد 96 ساعة: مصادرة الجلسة للصندوق الإداري
 */
export async function processGhostBookingsPenalties(): Promise<{
	warningsSent: number;
	escrowedCount: number;
}> {
	const now = new Date();
	const WARNING_1_MS = 24 * 60 * 60_000;
	const WARNING_2_MS = 48 * 60 * 60_000;
	const ESCROW_MS = 96 * 60 * 60_000;

	// لضمان الأداء (Performance)، لا نفحص كل الجلسات في تاريخ المنصة!
	// دورتنا القصوى هي 96 ساعة (4 أيام)، لذا سنفحص الجلسات في آخر 10 أيام فقط كحد أقصى (هامش أمان)
	const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60_000);

	// البحث عن الجلسات المؤكدة التي مضى وقتها ولم يُكتب تقريرها
	const confirmedGhostBookings = await prisma.booking.findMany({
		where: {
			status: BookingStatus.CONFIRMED,
			startTime: { gte: tenDaysAgo },
		},
		select: {
			id: true,
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

	for (const booking of confirmedGhostBookings) {
		const startMs = new Date(booking.startTime).getTime();
		const durationMs = booking.duration * 60_000;
		const endMs = startMs + durationMs;
		const timeSinceEndMs = now.getTime() - endMs;

		if (timeSinceEndMs <= WARNING_1_MS) continue; // لا تزال في فترة السماح

		try {
			await prisma.$transaction(async (tx) => {
				const teacherUserId = booking.teacherService.teacher.userId;

				// 1. المصادرة والإلغاء (بعد 96 ساعة)
				if (timeSinceEndMs > ESCROW_MS && booking.reportWarningLevel < 3) {
					await tx.booking.update({
						where: { id: booking.id },
						data: {
							status: BookingStatus.CANCELLED,
							reportWarningLevel: 3,
							cancellationReason:
								"تخلف المعلم عن كتابة التقرير للمدة القصوى (96 ساعة). تمت المصادرة.",
							cancelledAt: new Date(),
							paymentStatus:
								booking.paymentStatus === PaymentStatus.PAID && !booking.isTrial
									? PaymentStatus.REFUNDED
									: booking.paymentStatus,
						},
					});

					// إذا كان مدفوعاً، أرسل المال إلى صندوق الإدارة
					if (
						booking.paymentStatus === PaymentStatus.PAID &&
						!booking.isTrial
					) {
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

					// إشعار الإلغاء
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

					escrowedCount++;
				}
				// 2. التحذير النهائي وتجميد الرصيد (بعد 48 ساعة)
				else if (
					timeSinceEndMs > WARNING_2_MS &&
					booking.reportWarningLevel < 2
				) {
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

					warningsSent++;
				}
				// 3. التحذير الأول (بعد 24 ساعة)
				else if (
					timeSinceEndMs > WARNING_1_MS &&
					booking.reportWarningLevel < 1
				) {
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

					warningsSent++;
				}
			});
		} catch (err) {
			console.error(
				`Failed to process penalty for booking ${booking.id}:`,
				err,
			);
		}
	}

	return { warningsSent, escrowedCount };
}
