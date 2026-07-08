"use server";

import type { Teacher } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getErrorT } from "@/lib/i18n/get-server-translations";

export async function requireTeacherProfile(userId: string): Promise<
	Teacher & {
		user: { name: string | null; email: string; phone: string | null };
		subjects: { subjectId: string; subject: { name: string } }[];
	}
> {
	const teacher = await prisma.teacher.findUnique({
		where: { userId },
		include: {
			user: { select: { name: true, email: true, phone: true } },
			subjects: { include: { subject: true } },
		},
	});

	if (!teacher) {
		const t = await getErrorT();
		throw new Error(t("teacher_profile_not_found"));
	}

	return teacher;
}
