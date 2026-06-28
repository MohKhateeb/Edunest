import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient, resetAllPrismaMocks } from '../../mocks/prisma';
import { getAdminDashboardOverview } from '@/lib/services/domain/analytics-service';

// 1. Mock requireAuth and prisma
vi.mock('@/lib/require-auth', () => ({
	requireAuth: vi.fn().mockResolvedValue({ userId: 'admin-123', userType: 'ADMIN' }),
}));

vi.mock('@/lib/prisma', () => ({
	prisma: mockPrismaClient,
}));

describe('Analytics Service Performance Tests', () => {
	beforeEach(() => {
		resetAllPrismaMocks();
	});

	it('TEST 1 — Aggregate & groupBy are called, not findMany', async () => {
		mockPrismaClient.booking.aggregate.mockResolvedValue({
			_avg: { price: 150 },
		});
		mockPrismaClient.booking.groupBy.mockResolvedValue([
			{ status: 'COMPLETED', _count: { status: 5 } },
		]);
		mockPrismaClient.student.groupBy.mockResolvedValue([
			{ grade: 5, _count: { grade: 10 } },
		]);
		mockPrismaClient.$queryRaw.mockResolvedValue([]);

		await getAdminDashboardOverview();

		expect(mockPrismaClient.booking.aggregate).toHaveBeenCalled();
		expect(mockPrismaClient.booking.groupBy).toHaveBeenCalled();
		expect(mockPrismaClient.booking.findMany).not.toHaveBeenCalled();
	});

	it('TEST 2 — Correct return shape is mapped from database aggregates', async () => {
		mockPrismaClient.teacherVerification.count.mockResolvedValue(3);
		mockPrismaClient.booking.count.mockResolvedValue(100);
		mockPrismaClient.student.count.mockResolvedValue(50);
		mockPrismaClient.teacher.count.mockResolvedValue(12);
		mockPrismaClient.dispute.count.mockResolvedValue(2);
		mockPrismaClient.teacherPayout.count.mockResolvedValue(5);
		mockPrismaClient.adminEscrow.count.mockResolvedValue(8);

		mockPrismaClient.booking.aggregate.mockResolvedValue({
			_avg: { price: 250 },
		});
		mockPrismaClient.booking.groupBy.mockResolvedValue([
			{ status: 'COMPLETED', _count: { status: 40 } },
		]);
		mockPrismaClient.student.groupBy.mockResolvedValue([
			{ grade: 5, _count: { grade: 15 } },
		]);
		mockPrismaClient.$queryRaw.mockResolvedValue([]);

		const result = await getAdminDashboardOverview();

		expect(result).toEqual(
			expect.objectContaining({
				pendingVerifications: 3,
				totalBookings: 100,
				totalStudents: 50,
				activeTeachers: 12,
				averageOrderValue: 250,
				completionRate: expect.any(String),
				bookingStatuses: expect.arrayContaining([
					expect.objectContaining({ name: 'مكتمل', value: 40 }),
				]),
				registeredGrades: expect.arrayContaining([
					expect.objectContaining({ name: 'الصف 5', count: 15 }),
				]),
				openDisputesCount: 2,
				pendingPayoutsCount: 5,
				pendingEscrowsCount: 8,
			})
		);
	});

	it('TEST 3 — Correct WHERE filters are applied to aggregations', async () => {
		mockPrismaClient.booking.aggregate.mockResolvedValue({
			_avg: { price: 100 },
		});
		mockPrismaClient.booking.groupBy.mockResolvedValue([]);
		mockPrismaClient.student.groupBy.mockResolvedValue([]);
		mockPrismaClient.$queryRaw.mockResolvedValue([]);

		await getAdminDashboardOverview();

		expect(mockPrismaClient.booking.aggregate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { status: 'COMPLETED' },
			})
		);
	});
});
