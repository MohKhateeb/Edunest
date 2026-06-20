import { describe, it, expect, vi, beforeEach } from 'vitest';
import { acceptTutoringOffer } from '@/lib/actions/tutoring-request';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/require-auth';
import { RequestStatus, OfferStatus } from '@prisma/client';

// Mocking dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tutoringOffer: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    tutoringRequest: {
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    $executeRaw: vi.fn(),
    booking: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    teacherService: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/require-auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/settings', () => ({
  getSettingNumber: vi.fn().mockResolvedValue(15),
}));

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('acceptTutoringOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully accept an offer and create a booking', async () => {
    // 1. Mock requireAuth
    (requireAuth as any).mockResolvedValue({ userId: 'parent-123' });

    // 2. Mock offer
    const mockOffer = {
      id: 'offer-1',
      teacherId: 'teacher-1',
      status: OfferStatus.PENDING,
      price: 100,
      teacher: {
        userId: 'teacher-user-1',
        user: { name: 'Test Teacher' },
      },
      request: {
        id: 'request-1',
        parentId: 'parent-123',
        studentId: 'student-1',
        serviceTypeId: 'service-1',
        startTime: new Date('2026-07-01T10:00:00Z'),
        duration: 60,
        status: RequestStatus.PENDING,
        title: 'Test request',
        serviceType: { name: 'General Tutoring' },
        student: { id: 'student-1' },
      },
    };

    (prisma.tutoringOffer.findUnique as any).mockResolvedValue(mockOffer);

    // Mock transaction methods (tx context)
    // tx is passed as prisma in our mock
    (prisma.tutoringRequest.findUnique as any) = vi.fn().mockResolvedValue(mockOffer.request);
    (prisma.booking.findMany as any).mockResolvedValue([]); // No overlapping bookings
    (prisma.teacherService.findFirst as any).mockResolvedValue({ id: 'service-1' });
    (prisma.booking.create as any).mockResolvedValue({ id: 'booking-1' });

    // Execute
    const result = await acceptTutoringOffer('offer-1');

    // Assertions
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.bookingId).toBe('booking-1');
    }
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.tutoringRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: { status: RequestStatus.ACCEPTED },
    });
    expect(prisma.tutoringOffer.update).toHaveBeenCalledWith({
      where: { id: 'offer-1' },
      data: { status: OfferStatus.ACCEPTED },
    });
    expect(prisma.tutoringOffer.updateMany).toHaveBeenCalledWith({
      where: {
        requestId: 'request-1',
        id: { not: 'offer-1' },
      },
      data: { status: OfferStatus.REJECTED },
    });
  });

  it('should fail if request does not belong to parent', async () => {
    (requireAuth as any).mockResolvedValue({ userId: 'other-parent-456' });

    const mockOffer = {
      id: 'offer-1',
      request: {
        parentId: 'parent-123', // Different parent
      },
    };
    (prisma.tutoringOffer.findUnique as any).mockResolvedValue(mockOffer);

    const result = await acceptTutoringOffer('offer-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('غير مصرح لك بقبول هذا العرض');
    }
  });

  it('should fail if there is a scheduling conflict', async () => {
    (requireAuth as any).mockResolvedValue({ userId: 'parent-123' });

    const mockOffer = {
      id: 'offer-1',
      teacherId: 'teacher-1',
      status: OfferStatus.PENDING,
      request: {
        id: 'request-1',
        parentId: 'parent-123',
        startTime: new Date('2026-07-01T10:00:00Z'),
        duration: 60,
        status: RequestStatus.PENDING,
      },
    };
    (prisma.tutoringOffer.findUnique as any).mockResolvedValue(mockOffer);
    (prisma.tutoringRequest.findUnique as any) = vi.fn().mockResolvedValue(mockOffer.request);

    // Mock an overlapping booking
    (prisma.booking.findMany as any).mockResolvedValue([
      {
        startTime: new Date('2026-07-01T10:30:00Z'), // Overlaps
        duration: 60,
      },
    ]);

    const result = await acceptTutoringOffer('offer-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('المعلم لديه حجز آخر متداخل');
    }
  });
});
