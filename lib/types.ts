import {
	BookingSource,
	BookingStatus,
	PaymentMethod,
	PaymentStatus,
	type Prisma,
	UserType,
	VerificationLevel,
} from "@prisma/client";

export type ActionResponse<T = void> =
	| { success: true; data?: T }
	| { success: false; error: string };

export const bookingDetailsInclude = {
	student: true,
	teacherService: {
		include: {
			serviceType: true,
			teacher: {
				include: { user: { select: { name: true } } },
			},
		},
	},
	parent: { select: { name: true, phone: true, email: true } },
	payment: true,
	report: true,
	review: true,
} satisfies Prisma.BookingInclude;

export type EntityType = "student" | "teacher" | "booking" | "payout";

export const commonStudentInclude = {
	parent: { select: { id: true, name: true, email: true, phone: true } },
	bookings: {
		include: {
			teacherService: {
				include: {
					serviceType: true,
					teacher: { include: { user: { select: { name: true } } } },
				},
			},
			report: true,
			review: true,
		},
		orderBy: { startTime: "desc" as const },
	},
} satisfies Prisma.StudentInclude;

export const commonTeacherInclude = {
	user: { select: { id: true, name: true, email: true, phone: true } },
	services: {
		where: {
			isActive: true,
			serviceType: { isActive: true },
		},
		include: { serviceType: true },
	},
	reviews: {
		where: { isVisible: true },
		orderBy: { createdAt: "desc" as const },
		take: 15,
		include: {
			booking: { select: { student: { select: { name: true } } } },
		},
	},
	verification: true,
	subjects: { include: { subject: true } },
} satisfies Prisma.TeacherInclude;

export const commonPayoutInclude = {
	teacher: {
		include: { user: { select: { id: true, name: true, email: true } } },
	},
	bookings: {
		include: {
			student: { select: { name: true } },
			teacherService: {
				include: { serviceType: { select: { name: true } } },
			},
		},
		orderBy: { startTime: "desc" as const },
	},
} satisfies Prisma.TeacherPayoutInclude;

export type DetailedBooking = Prisma.BookingGetPayload<{
	include: typeof bookingDetailsInclude;
}>;

export {
	BookingSource,
	BookingStatus,
	PaymentMethod,
	PaymentStatus,
	UserType,
	VerificationLevel,
};
