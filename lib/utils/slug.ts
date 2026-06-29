import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function generateUniqueSlug(
	name: string,
	maxAttempts = 5,
): Promise<string> {
	// Normalize string for slug representation
	const base = `${name}`
		.toLowerCase()
		.replace(/[^\w\u0600-\u06FF\s-]/g, "") // Keep alphanumeric, Arabic, spaces, dashes
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	const existingTeachers = await prisma.teacher.findMany({
		where: { slug: { startsWith: `${base}-` } },
		select: { slug: true },
	});
	const existingSlugs = new Set(existingTeachers.map(t => t.slug));

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const suffix = crypto.randomBytes(3).toString("hex");
		const slug = `${base}-${suffix}`;
		if (!existingSlugs.has(slug)) return slug;
	}
	throw new Error("فشل توليد slug فريد بعد عدة محاولات");
}
