import { vi } from 'vitest';
import type {
	IUserRepository,
	IBookingRepository,
	ITeacherRepository,
	IStudentRepository,
} from '@/lib/repositories/types';

export function createMockUserRepository(): IUserRepository {
	return {
		findById: vi.fn().mockResolvedValue(null),
		findByEmail: vi.fn().mockResolvedValue(null),
		findByEmailExcludingId: vi.fn().mockResolvedValue(null),
		create: vi.fn().mockResolvedValue(null),
		update: vi.fn().mockResolvedValue(null),
		delete: vi.fn().mockResolvedValue(null),
	} as unknown as IUserRepository;
}

export function createMockBookingRepository(): IBookingRepository {
	return {
		findById: vi.fn().mockResolvedValue(null),
		findByUserId: vi.fn().mockResolvedValue([]),
		create: vi.fn().mockResolvedValue(null),
		update: vi.fn().mockResolvedValue(null),
		updateStatus: vi.fn().mockResolvedValue(null),
	} as unknown as IBookingRepository;
}

export function createMockTeacherRepository(): ITeacherRepository {
	return {
		create: vi.fn().mockResolvedValue(null),
	} as unknown as ITeacherRepository;
}

export function createMockStudentRepository(): IStudentRepository {
	return {
		create: vi.fn().mockResolvedValue(null),
		findById: vi.fn().mockResolvedValue(null),
		update: vi.fn().mockResolvedValue(null),
	} as unknown as IStudentRepository;
}
