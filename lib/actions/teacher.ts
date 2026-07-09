"use server";
import { getErrorT, getNotificationT, getValidationT } from "@/lib/i18n/get-server-translations";
import { UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { requireTeacherProfile } from "@/lib/actions/auth-helpers";
import { prisma } from "@/lib/prisma";
import { teacherRepository } from "@/lib/repositories/prisma/teacher.repository";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";
import { generateUniqueSlug } from "@/lib/utils/slug";
import {
	teacherProfileSchema,
	teacherServiceSchema,
} from "@/lib/validations/teacher";

export async function updateTeacherProfile(
	data: z.infer<typeof teacherProfileSchema>,
): Promise<ActionResponse<{ slug: string }>> {
    const t = await getErrorT();
	try {
		const { userId } = await requireAuth([UserType.TEACHER]);

		const validated = teacherProfileSchema.safeParse(data);
		if (!validated.success) {
			const tVal = await getValidationT();
			return { success: false, error: tVal(validated.error.issues[0].message) };
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: { teacher: true },
		});

		if (!user) {
			return { success: false, error: t("action_error_52") };
		}

		let slug = user.teacher?.slug || "";
		if (!slug) {
			slug = await generateUniqueSlug(user.name);
		}

		await teacherRepository.upsert(
			{ userId },
			{
				userId,
				subjects: {
					create: validated.data.subjectIds.map((id) => ({ subjectId: id })),
				},
				subSpecialization: validated.data.subSpecialization,
				bio: validated.data.bio,
				gradeLevels: validated.data.gradeLevels,
				city: validated.data.city,
				area: validated.data.area,
				education: validated.data.education,
				yearsOfExperience: validated.data.yearsOfExperience,
				defaultHourlyRate: validated.data.defaultHourlyRate,
				profileImageUrl: validated.data.profileImageUrl,
				slug,
			},
			{
				subjects: {
					deleteMany: {},
					create: validated.data.subjectIds.map((id) => ({ subjectId: id })),
				},
				subSpecialization: validated.data.subSpecialization,
				bio: validated.data.bio,
				gradeLevels: validated.data.gradeLevels,
				city: validated.data.city,
				area: validated.data.area,
				education: validated.data.education,
				yearsOfExperience: validated.data.yearsOfExperience,
				defaultHourlyRate: validated.data.defaultHourlyRate,
				profileImageUrl: validated.data.profileImageUrl,
				slug,
			}
		);

		revalidatePath(`/teachers/${slug}`);
		revalidatePath("/dashboard/teacher/profile");

		return { success: true, data: { slug } };
	} catch (err: unknown) {
		console.error(err);
		const msg =
			err instanceof Error ? err.message : t("action_error_60");
		return { success: false, error: msg };
	}
}

export async function addOrUpdateTeacherService(
	data: z.infer<typeof teacherServiceSchema>,
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const { userId } = await requireAuth([UserType.TEACHER]);

		const validated = teacherServiceSchema.safeParse(data);
		if (!validated.success) {
			const tVal = await getValidationT();
			return { success: false, error: tVal(validated.error.issues[0].message) };
		}

		const teacher = await requireTeacherProfile(userId);

		// Check if the service type exists
		const serviceType = await prisma.serviceType.findUnique({
			where: { id: validated.data.serviceTypeId },
		});

		if (!serviceType) {
			return { success: false, error: t("action_error_53") };
		}

		const existingService = await prisma.teacherService.findFirst({
			where: { teacherId: teacher.id, serviceTypeId: serviceType.id },
		});

		// Upsert the teacher service
		if (existingService) {
			await prisma.teacherService.update({
				where: { id: existingService.id },
				data: {
					price: validated.data.price,
					duration: validated.data.duration,
					customDescription: validated.data.customDescription,
					isActive: true,
				},
			});
		} else {
			await prisma.teacherService.create({
				data: {
					teacherId: teacher.id,
					serviceTypeId: serviceType.id,
					price: validated.data.price,
					duration: validated.data.duration,
					customDescription: validated.data.customDescription,
				},
			});
		}

		revalidatePath(`/teachers/${teacher.slug}`);
		revalidatePath("/dashboard/teacher/services");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: t("action_error_54") };
	}
}

export async function submitVerificationDocuments(data: {
	nationalIdUrl?: string;
	degreeUrl?: string;
	videoInterviewUrl?: string;
}): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const { userId } = await requireAuth([UserType.TEACHER]);

		const teacher = await requireTeacherProfile(userId);

		await prisma.teacherVerification.upsert({
			where: { teacherId: teacher.id },
			update: {
				nationalIdUrl: data.nationalIdUrl,
				degreeUrl: data.degreeUrl,
				videoInterviewUrl: data.videoInterviewUrl,
				reviewedBy: null,
				reviewedAt: null,
				rejectionReason: null,
			},
			create: {
				teacherId: teacher.id,
				nationalIdUrl: data.nationalIdUrl,
				degreeUrl: data.degreeUrl,
				videoInterviewUrl: data.videoInterviewUrl,
			},
		});

		revalidatePath("/dashboard/teacher/verification");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: t("action_error_55") };
	}
}

import { teacherSlugSchema } from "@/lib/validations/teacher";

export async function updateTeacherSlug(
	data: z.infer<typeof teacherSlugSchema>,
): Promise<ActionResponse<{ slug: string }>> {
    const t = await getErrorT();
	try {
		const { userId } = await requireAuth([UserType.TEACHER]);

		const validated = teacherSlugSchema.safeParse(data);
		if (!validated.success) {
			const tVal = await getValidationT();
			return { success: false, error: tVal(validated.error.issues[0].message) };
		}

		const { slug: newSlug } = validated.data;

		const teacher = await requireTeacherProfile(userId);

		if (teacher.slugUpdated) {
			return {
				success: false,
				error: t("action_error_56"),
			};
		}

		// Check if slug is unique
		const existingSlug = await teacherRepository.findBySlug(newSlug);

		if (existingSlug && existingSlug.id !== teacher.id) {
			return {
				success: false,
				error: t("action_error_57"),
			};
		}

		await teacherRepository.update(
			teacher.id,
			{
				slug: newSlug,
				slugUpdated: true,
			}
		);

		revalidatePath(`/teachers/${newSlug}`);
		revalidatePath("/dashboard/teacher/profile");
		if (teacher.slug) {
			revalidatePath(`/teachers/${teacher.slug}`);
		}

		return { success: true, data: { slug: newSlug } };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: t("action_error_58") };
	}
}

export async function toggleTeacherAvailability(
	isAvailableNow: boolean,
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const { userId } = await requireAuth([UserType.TEACHER]);

		const teacher = await requireTeacherProfile(userId);

		await teacherRepository.updateAvailability(teacher.id, isAvailableNow);

		revalidatePath("/dashboard/teacher");
		revalidatePath(`/teachers/${teacher.slug}`);

		return { success: true };
	} catch (error) {
		console.error("Error toggling availability:", error);
		return { success: false, error: t("action_error_59") };
	}
}
