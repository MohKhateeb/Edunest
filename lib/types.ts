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
	parent: { select: { name: true } },
	payment: true,
	report: true,
} satisfies Prisma.BookingInclude;

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
