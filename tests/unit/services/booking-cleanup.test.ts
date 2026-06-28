import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient, resetAllPrismaMocks } from '../../mocks/prisma';
import {
	processStaleBookingsCancellation,
	CLEANUP_HANDLERS,
} from '@/lib/services/booking-cleanup';
import { BookingStatus } from '@prisma/client';

// Mock notification helper & prisma
vi.mock('@/lib/notifications', () => ({
	createNotification: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/prisma', () => ({
	prisma: mockPrismaClient,
}));

describe('Booking Cleanup Service Tests (OCP Strategy Map)', () => {
	beforeEach(() => {
		resetAllPrismaMocks();
	});

	it('TEST 1 — Correct handler invoked per status (PENDING stale cancellation)', async () => {
		const mockPendingBooking = {
			id: 'booking-pending-123',
			status: BookingStatus.PENDING,
			parentUserId: 'parent-1',
			price: 150,
			paymentStatus: 'PAID',
			isTrial: false,
			payment: { id: 'payment-1' },
		};

		mockPrismaClient.booking.findMany.mockResolvedValue([mockPendingBooking]);

		const result = await processStaleBookingsCancellation();

		// Should successfully process 1 cancellation
		expect(result).toBe(1);

		// Assert: expected update for PENDING stale booking was called
		expect(mockPrismaClient.booking.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'booking-pending-123' },
				data: expect.objectContaining({
					status: BookingStatus.CANCELLED,
				}),
			})
		);

		// Assert: CONFIRMED ghost booking actions (like adminEscrow) were NOT called
		expect(mockPrismaClient.adminEscrow.create).not.toHaveBeenCalled();
	});

	it("TEST 2 — Unknown status doesn't crash", async () => {
		const mockUnknownBooking = {
			id: 'booking-unknown',
			status: 'UNKNOWN_STATUS_TYPE' as any,
		};

		// Call the handler directly on the strategy map with unknown status
		await expect(
			CLEANUP_HANDLERS[mockUnknownBooking.status]?.(mockUnknownBooking as any)
		).toBeUndefined(); // Map should return undefined and do nothing safely
	});

	it('TEST 3 — Multiple bookings processed with mixed statuses via CLEANUP_HANDLERS', async () => {
		// Mock bookings for different statuses
		const staleBooking = {
			id: 'booking-stale-1',
			status: BookingStatus.PENDING,
			parentUserId: 'parent-1',
			price: 100,
			paymentStatus: 'UNPAID',
			isTrial: false,
			payment: null,
		};

		const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
		const ghostBooking = {
			id: 'booking-ghost-2',
			status: BookingStatus.CONFIRMED,
			startTime: fiveDaysAgo,
			duration: 60,
			reportWarningLevel: 0,
			parentUserId: 'parent-2',
			price: 200,
			paymentStatus: 'UNPAID',
			isTrial: false,
			payment: null,
			teacherService: {
				teacher: { userId: 'teacher-1' },
			},
		};

		const bookings = [staleBooking, ghostBooking];

		// Manually run them through the Strategy Map
		for (const booking of bookings) {
			await CLEANUP_HANDLERS[booking.status]?.(booking as any);
		}

		// Verify PENDING handler updated database
		expect(mockPrismaClient.booking.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'booking-stale-1' },
				data: expect.objectContaining({
					status: BookingStatus.CANCELLED,
				}),
			})
		);

		// Verify CONFIRMED handler triggered the warning / action for ghost booking
		expect(mockPrismaClient.booking.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'booking-ghost-2' },
				data: expect.objectContaining({
					reportWarningLevel: 3, // Since it's > 96 hours (5 days), it gets cancelled & warning level 3
				}),
			})
		);
	});
});
