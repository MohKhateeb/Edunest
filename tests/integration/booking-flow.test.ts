import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingStatus, PaymentStatus, UserType } from "@prisma/client";
import { createBooking } from "@/lib/actions/bookings/create";
import { acceptBooking } from "@/lib/actions/bookings/accept";
import { processPayment } from "@/lib/actions/bookings/pay";

// 1. Mock dependencies
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
}));

vi.mock("@/lib/require-auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
	createNotification: vi.fn(),
}));

vi.mock("@/lib/settings", () => ({
	getSettingNumber: vi.fn().mockResolvedValue(2), // MinBookingLeadHours
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		$transaction: vi.fn(),
		student: {
			findUnique: vi.fn().mockResolvedValue({ id: "student-123", parentUserId: "parent-user" }),
		},
		teacherService: {
			findUnique: vi.fn().mockResolvedValue({
				id: "service-123",
				price: 150,
				duration: 60,
				serviceType: { name: "جلسة تعليمية" },
				teacher: { id: "teacher-123", userId: "teacher-user", isVerified: true },
			}),
		},
		user: {
			findUnique: vi.fn().mockResolvedValue({ id: "parent-user" }),
		},
	},
}));

vi.mock("@/lib/utils/availability", () => ({
	checkTeacherAvailability: vi.fn().mockResolvedValue({ available: true }),
}));

vi.mock("@/lib/repositories/unit-of-work", () => ({
	unitOfWork: {
		runTransaction: vi.fn(async (cb) => {
			const fakeTx = {
				payment: {
					update: vi.fn(),
					create: vi.fn(),
				},
				escrow: {
					create: vi.fn(),
				},
				booking: {
					update: vi.fn(),
				},
				$executeRaw: vi.fn(),
			};
			return cb(fakeTx);
		}),
	},
}));

vi.mock("@/lib/repositories/prisma/booking.repository", () => ({
	bookingRepository: {
		create: vi.fn().mockResolvedValue({ id: "booking-123" }),
		update: vi.fn(),
		findActiveByTeacherId: vi.fn().mockResolvedValue([]),
		findActiveByStudentId: vi.fn().mockResolvedValue([]),
	},
}));

vi.mock("@/lib/repositories/prisma/teacher.repository", () => ({
	teacherRepository: {
		findById: vi.fn().mockResolvedValue({
			id: "teacher-123",
			userId: "teacher-user",
		}),
	},
}));

vi.mock("@/lib/repositories/prisma/student.repository", () => ({
	studentRepository: {
		findById: vi.fn().mockResolvedValue({
			id: "student-123",
			userId: "parent-user",
		}),
	},
}));

vi.mock("@/lib/services/booking-service", () => ({
	getAuthorizedBooking: vi.fn(),
}));

// Import mocked modules so we can configure them per-test
import { requireAuth } from "@/lib/require-auth";
import { bookingRepository } from "@/lib/repositories/prisma/booking.repository";
import { getAuthorizedBooking } from "@/lib/services/booking-service";

describe("Booking Flow Integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should complete the full booking lifecycle: Request -> Accept -> Pay", async () => {
		// ---------------------------------------------------------
		// STEP 1: Student Requests Booking
		// ---------------------------------------------------------
		// Mock student authentication
		vi.mocked(requireAuth).mockResolvedValue({
			userId: "parent-user",
			userType: UserType.PARENT,
		});

		const futureDate = new Date();
		futureDate.setHours(futureDate.getHours() + 48); // 48 hours from now

		const bookingData = {
			studentId: "student-123",
			teacherServiceId: "service-123",
			startTime: futureDate,
			isTrial: false,
			questionTitle: "Math help",
			paymentMethod: "ONLINE_CARD" as any,
		};

		const createResult = await createBooking(bookingData);

		if (!createResult.success) {
			console.log("Create Result Error:", createResult.error);
		}

		expect(createResult.success).toBe(true);
		expect(bookingRepository.create).toHaveBeenCalled();

		// ---------------------------------------------------------
		// STEP 2: Student Pays
		// ---------------------------------------------------------
		let currentBookingState = {
			id: "booking-123",
			status: BookingStatus.PENDING,
			paymentStatus: PaymentStatus.UNPAID,
			startTime: futureDate,
			isTrial: false,
			teacher: { userId: "teacher-user" },
			teacherService: { teacher: { userId: "teacher-user" } },
			student: { userId: "parent-user" },
			price: 150,
		};
		vi.mocked(getAuthorizedBooking).mockResolvedValue(currentBookingState as any);

		const payResult = await processPayment("booking-123");

		expect(payResult.success).toBe(true);

		// Update mock state to reflect successful payment
		currentBookingState.paymentStatus = PaymentStatus.PAID;

		// ---------------------------------------------------------
		// STEP 3: Teacher Accepts Booking
		// ---------------------------------------------------------
		vi.mocked(requireAuth).mockResolvedValue({
			userId: "teacher-user",
			userType: UserType.TEACHER,
		});

		const acceptResult = await acceptBooking("booking-123");

		expect(acceptResult.success).toBe(true);
		expect(bookingRepository.update).toHaveBeenCalledWith(
			"booking-123",
			expect.objectContaining({ status: BookingStatus.CONFIRMED }),
			expect.anything()
		);
	});
});
