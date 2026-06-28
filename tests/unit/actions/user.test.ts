import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUser, updateUserProfile } from '@/lib/actions/user';
import { createMockUserRepository } from '../../mocks/repositories';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/require-auth';

// 1. Mock Next.js cache & auth & prisma
vi.mock('next/cache', () => ({
	revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	redirect: vi.fn(),
}));

vi.mock('@/lib/require-auth', () => ({
	requireAuth: vi.fn().mockResolvedValue({ userId: 'user-123', userType: 'PARENT' }),
}));

vi.mock('@/lib/prisma', () => ({
	prisma: {},
}));

// 2. Instantiate Mocks using vi.hoisted so they are initialized before vi.mock calls run
const { mockUserRepo, mockTeacherRepo, mockStudentRepo, mockUnitOfWork } = vi.hoisted(() => {
	return {
		mockUserRepo: {
			findById: vi.fn().mockResolvedValue(null),
			findByEmail: vi.fn().mockResolvedValue(null),
			findByEmailExcludingId: vi.fn().mockResolvedValue(null),
			create: vi.fn().mockResolvedValue(null),
			update: vi.fn().mockResolvedValue(null),
			delete: vi.fn().mockResolvedValue(null),
		},
		mockTeacherRepo: { create: vi.fn().mockResolvedValue({}) },
		mockStudentRepo: {
			create: vi.fn().mockResolvedValue({}),
			findById: vi.fn().mockResolvedValue(null),
			update: vi.fn().mockResolvedValue({}),
		},
		mockUnitOfWork: {
			runTransaction: vi.fn().mockImplementation(async (cb) => cb('mock-tx')),
		},
	};
});

vi.mock('@/lib/repositories/prisma/user.repository', () => ({
	PrismaUserRepository: class {
		findById = mockUserRepo.findById;
		findByEmail = mockUserRepo.findByEmail;
		findByEmailExcludingId = mockUserRepo.findByEmailExcludingId;
		create = mockUserRepo.create;
		update = mockUserRepo.update;
		delete = mockUserRepo.delete;
	}
}));

vi.mock('@/lib/repositories/prisma/teacher.repository', () => ({
	PrismaTeacherRepository: class {
		create = mockTeacherRepo.create;
	}
}));

vi.mock('@/lib/repositories/prisma/student.repository', () => ({
	PrismaStudentRepository: class {
		create = mockStudentRepo.create;
		findById = mockStudentRepo.findById;
		update = mockStudentRepo.update;
	}
}));

vi.mock('@/lib/repositories/unit-of-work', () => ({
	PrismaUnitOfWork: class {
		runTransaction = mockUnitOfWork.runTransaction;
	}
}));

describe('User Server Actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('registerUser', () => {
		const validRegistration = {
			name: 'John Doe',
			email: 'john@example.com',
			password: 'password123',
			userType: 'PARENT' as const,
		};

		it('TEST 1 — Happy path: registers user successfully and uses repository inside transaction', async () => {
			vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
			vi.mocked(mockUserRepo.create).mockResolvedValue({ id: 'new-user-123' } as any);

			const result = await registerUser(validRegistration);

			expect(result).toEqual({ success: true });
			expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('john@example.com');
			expect(mockUnitOfWork.runTransaction).toHaveBeenCalled();
			expect(mockUserRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'John Doe',
					email: 'john@example.com',
					userType: 'PARENT',
				}),
				'mock-tx'
			);
		});

		it('TEST 2 — Validation failure: returns error and does not call repository', async () => {
			const invalidRegistration = {
				name: '',
				email: 'not-an-email',
				password: '123', // too short
				userType: 'PARENT' as const,
			};

			const result = await registerUser(invalidRegistration) as any;

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
			expect(mockUserRepo.create).not.toHaveBeenCalled();
		});
	});

	describe('updateUserProfile', () => {
		const validProfile = {
			name: 'New Name',
			email: 'new@example.com',
			phone: '0123456789',
		};

		it('TEST 1 — Happy path: updates user profile and calls revalidatePath', async () => {
			vi.mocked(mockUserRepo.findByEmailExcludingId).mockResolvedValue(null);
			vi.mocked(mockUserRepo.update).mockResolvedValue({ id: 'user-123' } as any);

			const result = await updateUserProfile(validProfile);

			expect(result).toEqual({ success: true });
			expect(mockUserRepo.findByEmailExcludingId).toHaveBeenCalledWith('new@example.com', 'user-123');
			expect(mockUserRepo.update).toHaveBeenCalledWith('user-123', {
				name: 'New Name',
				email: 'new@example.com',
				phone: '0123456789',
			});
			expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
		});

		it('TEST 2 — Validation failure: returns error and does not update DB', async () => {
			const invalidProfile = {
				name: '',
				email: 'bad-email',
				phone: '123', // too short
			};

			const result = await updateUserProfile(invalidProfile) as any;

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(mockUserRepo.findByEmailExcludingId).not.toHaveBeenCalled();
			expect(mockUserRepo.update).not.toHaveBeenCalled();
		});
	});
});
