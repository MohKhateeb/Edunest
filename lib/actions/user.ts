"use server";

import { UserType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { z } from "zod";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { PrismaUserRepository } from "@/lib/repositories/prisma/user.repository";
import { PrismaTeacherRepository } from "@/lib/repositories/prisma/teacher.repository";
import { PrismaStudentRepository } from "@/lib/repositories/prisma/student.repository";
import { PrismaUnitOfWork } from "@/lib/repositories/unit-of-work";
import {
	changePasswordSchema,
	registerSchema,
	studentSchema,
	updateProfileSchema,
} from "@/lib/validations/user";
import { getErrorT, getValidationT } from "@/lib/i18n/get-server-translations";
import { checkRateLimit } from "@/lib/utils/rate-limit";

const userRepository = new PrismaUserRepository();
const teacherRepository = new PrismaTeacherRepository();
const studentRepository = new PrismaStudentRepository();
const unitOfWork = new PrismaUnitOfWork();

// ─── Private DB Helpers ───

async function _registerUserInDb(
	data: z.infer<typeof registerSchema> & { subjectIds?: string[] },
): Promise<ActionResponse> {
	const { name, email, password, phone, userType } = data;
	const cleanEmail = email.toLowerCase().trim();

	const existing = await userRepository.findByEmail(cleanEmail);

	if (existing) {
		const tError = await getErrorT();
		return { success: false, error: tError('user_email_already_registered') };
	}

	const passwordHash = await bcrypt.hash(password, 12);

	await unitOfWork.runTransaction(async (tx) => {
		const user = await userRepository.create({
			name,
			email: cleanEmail,
			passwordHash,
			phone: phone || null,
			userType,
		}, tx);

		if (userType === UserType.TEACHER) {
			const slug = await generateUniqueSlug(name);
			await teacherRepository.create({
				userId: user.id,
				slug,
				subjects: data.subjectIds?.length
					? {
							create: data.subjectIds.map((id) => ({ subjectId: id })),
					  }
					: undefined,
			}, tx);
		}
	});

	return { success: true };
}

async function _addStudentInDb(userId: string, data: z.infer<typeof studentSchema>): Promise<ActionResponse> {
	await studentRepository.create({
		parentUserId: userId,
		name: data.name,
		grade: data.grade,
		school: data.school || null,
	});
	return { success: true };
}

async function _updateStudentInDb(
	studentId: string,
	userId: string,
	data: z.infer<typeof studentSchema>,
): Promise<ActionResponse> {
	const student = await studentRepository.findById(studentId, {
		include: {
			_count: {
				select: { bookings: true },
			},
		},
	});

	const tError = await getErrorT();

	if (!student) {
		return { success: false, error: tError('student_not_found') };
	}

	if (student.parentUserId !== userId) {
		return { success: false, error: tError('student_unauthorized_edit') };
	}

	if (student._count.bookings > 0) {
		return {
			success: false,
			error: tError('student_has_scheduled_sessions'),
		};
	}

	await studentRepository.update(studentId, {
		name: data.name,
		grade: data.grade,
		school: data.school || null,
	});

	return { success: true };
}

async function _updateUserProfileInDb(
	userId: string,
	data: z.infer<typeof updateProfileSchema>,
): Promise<ActionResponse> {
	const { name, email, phone, preferredCurrency } = data;
	const cleanEmail = email.toLowerCase().trim();

	const existing = await userRepository.findByEmailExcludingId(cleanEmail, userId);

	if (existing) {
		const tError = await getErrorT();
		return {
			success: false,
			error: tError('user_email_in_use_by_other'),
		};
	}

	await userRepository.update(userId, {
		name,
		email: cleanEmail,
		phone: phone || null,
		preferredCurrency: (preferredCurrency as any) || null,
	});

	return { success: true };
}

async function _changeUserPasswordInDb(
	userId: string,
	data: z.infer<typeof changePasswordSchema>,
): Promise<ActionResponse> {
	const { currentPassword, newPassword } = data;

	const user = await userRepository.findById(userId);
	const tError = await getErrorT();

	if (!user) {
		return { success: false, error: tError('user_not_found') };
	}

	const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
	if (!isValid) {
		return { success: false, error: tError('user_wrong_current_password') };
	}

	const passwordHash = await bcrypt.hash(newPassword, 12);
	await userRepository.update(userId, { passwordHash });

	return { success: true };
}

// ─── Exported Actions ───

export async function registerUser(
	data: z.infer<typeof registerSchema> & { subjectIds?: string[] },
): Promise<ActionResponse> {
	try {
		const validated = registerSchema.safeParse(data);
		if (!validated.success) {
			const t = await getValidationT();
			return { success: false, error: t(validated.error.issues[0].message) };
		}

		const headersList = await headers();
		const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
		const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60_000);
		if (!rl.allowed) {
			const tError = await getErrorT();
			return { success: false, error: tError("rate_limit_exceeded") };
		}

		const result = await _registerUserInDb(validated.data);
		if (!result.success) return result;

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		const tError = await getErrorT();
		return { success: false, error: tError('user_registration_error') };
	}
}

export async function addStudent(
	data: z.infer<typeof studentSchema>,
): Promise<ActionResponse> {
	try {
		const { userId } = await requireAuth([UserType.PARENT]);

		const validated = studentSchema.safeParse(data);
		if (!validated.success) {
			const t = await getValidationT();
			return { success: false, error: t(validated.error.issues[0].message) };
		}

		const result = await _addStudentInDb(userId, validated.data);
		if (!result.success) return result;

		revalidatePath("/dashboard/parent/students");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		const tError = await getErrorT();
		return { success: false, error: tError('student_add_error') };
	}
}

export async function updateStudent(
	studentId: string,
	data: z.infer<typeof studentSchema>,
): Promise<ActionResponse> {
	try {
		const { userId } = await requireAuth([UserType.PARENT]);

		const validated = studentSchema.safeParse(data);
		if (!validated.success) {
			const t = await getValidationT();
			return { success: false, error: t(validated.error.issues[0].message) };
		}

		const result = await _updateStudentInDb(studentId, userId, validated.data);
		if (!result.success) return result;

		revalidatePath("/dashboard/parent/students");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		const tError = await getErrorT();
		return { success: false, error: tError('student_update_error') };
	}
}

export async function updateUserProfile(
	data: z.infer<typeof updateProfileSchema>,
): Promise<ActionResponse> {
	try {
		const { userId } = await requireAuth([
			UserType.PARENT,
			UserType.TEACHER,
			UserType.ADMIN,
		]);

		const validated = updateProfileSchema.safeParse(data);
		if (!validated.success) {
			const t = await getValidationT();
			return { success: false, error: t(validated.error.issues[0].message) };
		}

		const result = await _updateUserProfileInDb(userId, validated.data);
		if (!result.success) return result;

		revalidatePath("/dashboard");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		const tError = await getErrorT();
		return { success: false, error: tError('user_profile_update_error') };
	}
}

export async function changeUserPassword(
	data: z.infer<typeof changePasswordSchema>,
): Promise<ActionResponse> {
	try {
		const { userId } = await requireAuth([
			UserType.PARENT,
			UserType.TEACHER,
			UserType.ADMIN,
		]);

		const validated = changePasswordSchema.safeParse(data);
		if (!validated.success) {
			const t = await getValidationT();
			return { success: false, error: t(validated.error.issues[0].message) };
		}

		const result = await _changeUserPasswordInDb(userId, validated.data);
		if (!result.success) return result;

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		const tError = await getErrorT();
		return { success: false, error: tError('user_password_change_error') };
	}
}
