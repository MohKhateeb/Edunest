"use server";

import type { Teacher } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
		throw new Error("الملف الشخصي للمعلم غير موجود.");
	}

	return teacher;
}
