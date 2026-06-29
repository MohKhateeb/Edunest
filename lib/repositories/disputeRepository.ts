import { DisputeStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export type DisputeWithFullDetails = Prisma.DisputeGetPayload<{
	include: {
		booking: {
			include: {
				student: true;
				parent: true;
				teacherService: {
					include: {
						teacher: { include: { user: true } };
						serviceType: true;
					};
				};
			};
		};
		messages: {
			include: { sender: true };
		};
	};
}>;

export type BookingForDisputeCreation = Prisma.BookingGetPayload<{
	include: {
		dispute: true;
		teacherService: {
			include: { teacher: true };
		};
	};
}>;

export type DisputeWithBookingAccess = Prisma.DisputeGetPayload<{
	include: {
		booking: {
			include: {
				teacherService: { include: { teacher: true } };
			};
		};
	};
}>;

export type DisputeForResolution = Prisma.DisputeGetPayload<{
	include: {
		booking: {
			include: {
				payment: true;
				teacherService: { include: { teacher: true } };
			};
		};
	};
}>;

class DisputeRepository {
	// Used by: getSecureDisputeDetails
	// Returns dispute with: booking(student, parent, teacherService(teacher(user), serviceType)),
	//                       messages(sender) ordered by createdAt asc
	async findByIdWithFullDetails(id: string): Promise<DisputeWithFullDetails | null> {
		return prisma.dispute.findUnique({
			where: { id },
			include: {
				booking: {
					include: {
						student: true,
						parent: true,
						teacherService: {
							include: {
								teacher: { include: { user: true } },
								serviceType: true,
							},
						},
					},
				},
				messages: {
					include: { sender: true },
					orderBy: { createdAt: "asc" },
				},
			},
		});
	}

	// Used by: createDispute
	// Returns booking with: dispute, teacherService(teacher)
	async findBookingWithDisputeAndTeacher(bookingId: string): Promise<BookingForDisputeCreation | null> {
		return prisma.booking.findUnique({
			where: { id: bookingId },
			include: {
				dispute: true,
				teacherService: {
					include: { teacher: true },
				},
			},
		});
	}

	// Used by: createDispute (inside $transaction)
	// Creates dispute + initial system message + teacher notification atomically
	async createWithInitialMessage(params: {
		bookingId: string;
		parentUserId: string;
		reason: string;
		teacherUserId: string;
	}): Promise<void> {
		await prisma.$transaction(async (tx) => {
			const dispute = await tx.dispute.create({
				data: {
					bookingId: params.bookingId,
					parentUserId: params.parentUserId,
					reason: params.reason,
					status: DisputeStatus.OPEN,
				},
			});

			await tx.disputeMessage.create({
				data: {
					disputeId: dispute.id,
					senderId: params.parentUserId,
					message: `[رسالة النظام - فتح الاعتراض]: ${params.reason}`,
				},
			});

			// Send notifications to Teacher
			await createNotification(
				{
					userId: params.teacherUserId,
					title: "اعتراض جديد ⚠️",
					message:
						"قام ولي الأمر برفع اعتراض على جلستك الأخيرة. تم تجميد مستحقات الجلسة مؤقتاً.",
				},
				tx,
			);
		});
	}

	// Used by: sendDisputeMessage
	// Returns dispute with: booking(teacherService(teacher))
	async findByIdWithBookingAccess(id: string): Promise<DisputeWithBookingAccess | null> {
		return prisma.dispute.findUnique({
			where: { id },
			include: {
				booking: {
					include: {
						teacherService: { include: { teacher: true } },
					},
				},
			},
		});
	}

	// Used by: sendDisputeMessage
	async addMessage(disputeId: string, senderId: string, message: string): Promise<void> {
		await prisma.disputeMessage.create({
			data: {
				disputeId,
				senderId,
				message,
			},
		});
	}

	// Used by: changeDisputeTurn
	async findById(id: string): Promise<{ status: string; allowedTurn: string } | null> {
		return prisma.dispute.findUnique({
			where: { id },
			select: { status: true, allowedTurn: true },
		});
	}

	// Used by: changeDisputeTurn
	async updateTurn(disputeId: string, turn: "BOTH" | "PARENT" | "TEACHER" | "NONE"): Promise<void> {
		await prisma.dispute.update({
			where: { id: disputeId },
			data: { allowedTurn: turn },
		});
	}

	// Used by: resolveDispute
	// Returns dispute with: booking(price, payment, teacherService(teacher)), parentUserId
	async findByIdForResolution(id: string): Promise<DisputeForResolution | null> {
		return prisma.dispute.findUnique({
			where: { id },
			include: {
				booking: {
					include: {
						payment: true,
						teacherService: { include: { teacher: true } },
					},
				},
			},
		});
	}

	// Used by: resolveDispute (inside $transaction)
	// Handles: dispute update + message + optional refund + two notifications atomically
	async resolveWithTransaction(params: {
		disputeId: string;
		bookingId: string;
		decision: "RESOLVED_IN_FAVOR_OF_PARENT" | "RESOLVED_IN_FAVOR_OF_TEACHER";
		adminUserId: string;
		adminNotes?: string;
		bookingPrice: number | any;
		parentUserId: string;
		teacherUserId: string;
	}): Promise<void> {
		await prisma.$transaction(async (tx) => {
			// 1. Update dispute status
			await tx.dispute.update({
				where: { id: params.disputeId },
				data: {
					status: params.decision as DisputeStatus,
					resolvedAt: new Date(),
					resolvedBy: params.adminUserId,
					adminNotes: params.adminNotes,
				},
			});

			// 2. Log message
			await tx.disputeMessage.create({
				data: {
					disputeId: params.disputeId,
					senderId: params.adminUserId,
					message: `[رسالة إدارية - إغلاق النزاع]: تم إغلاق النزاع وحله بناءً على القرار الإداري.\nملاحظات الإدارة: ${params.adminNotes || "لا يوجد"}`,
				},
			});

			// 3. Update payment logic if resolved in favor of parent
			if (params.decision === "RESOLVED_IN_FAVOR_OF_PARENT") {
				await tx.booking.update({
					where: { id: params.bookingId },
					data: { paymentStatus: "REFUNDED" },
				});

				// Create ParentRefund pending transfer
				await tx.parentRefund.create({
					data: {
						bookingId: params.bookingId,
						amount: params.bookingPrice,
						isPaid: false,
					},
				});
			}

			// Notifications
			await createNotification(
				{
					userId: params.parentUserId,
					title: "قرار بشأن اعتراضك",
					message:
						params.decision === "RESOLVED_IN_FAVOR_OF_PARENT"
							? "تم حل الاعتراض لصالحك وجاري إرجاع المبلغ."
							: "تم رفض الاعتراض بعد المراجعة. راجع المحادثة للتفاصيل.",
				},
				tx,
			);

			await createNotification(
				{
					userId: params.teacherUserId,
					title: "إغلاق النزاع المالي",
					message:
						params.decision === "RESOLVED_IN_FAVOR_OF_TEACHER"
							? "تم الحكم بصالحك في النزاع الأخير، وسيضاف الرصيد لدفعاتك القادمة."
							: "تم قبول اعتراض ولي الأمر واسترداد مبلغ الجلسة.",
				},
				tx,
			);
		});
	}
}

export const disputeRepository = new DisputeRepository();
