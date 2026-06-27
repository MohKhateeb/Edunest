import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { Prisma, UserType } from "@prisma/client";

export type ParentFinancialBooking = Prisma.BookingGetPayload<{
	include: {
		teacherService: {
			include: {
				teacher: { include: { user: true } };
				serviceType: true;
			};
		};
		student: true;
		payment: true;
		dispute: true;
		parentRefund: true;
	};
}>;

export type ParentFinancialStats = {
	bookings: ParentFinancialBooking[];
	totalSpent: number;
	totalRefunded: number;
	teachers: { id: string; name: string }[];
};

export async function getParentFinancials(
	userId: string,
	dateFilter?: string,
	teacherFilter?: string,
): Promise<ParentFinancialStats> {
	await requireAuth([UserType.PARENT]);

	const whereClause: Prisma.BookingWhereInput = {
		parentUserId: userId,
	};

	if (dateFilter) {
		const start = new Date(dateFilter);
		const end = new Date(dateFilter);
		end.setHours(23, 59, 59, 999);
		whereClause.createdAt = { gte: start, lte: end };
	}

	if (teacherFilter) {
		whereClause.teacherService = {
			teacher: { userId: teacherFilter },
		};
	}

	const bookings = await prisma.booking.findMany({
		where: whereClause,
		include: {
			teacherService: {
				include: {
					teacher: { include: { user: true } },
					serviceType: true,
				},
			},
			student: true,
			payment: true,
			dispute: true,
			parentRefund: true,
		},
		orderBy: { createdAt: "desc" },
	});

	let totalSpent = 0;
	let totalRefunded = 0;

	for (const b of bookings) {
		const price = Number(b.price);
		if (b.paymentStatus === "PAID") {
			totalSpent += price;
		} else if (b.paymentStatus === "REFUNDED") {
			totalRefunded += price;
		}
	}

	const teachers = await prisma.user.findMany({
		where: { userType: "TEACHER" },
		select: { id: true, name: true },
	});

	return {
		bookings,
		totalSpent,
		totalRefunded,
		teachers,
	};
}
