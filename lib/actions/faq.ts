"use server";

import { type FAQ, type FAQCategory, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";
import { faqIdSchema, faqSchema, faqUpdateSchema } from "@/lib/validations/faq";

// Fetch FAQs for public/dashboard view (read-only, no auth required)
export async function getFAQs(
	category?: FAQCategory,
	includeInactive = false,
): Promise<ActionResponse<FAQ[]>> {
	try {
		const faqs = await prisma.fAQ.findMany({
			where: {
				...(category ? { category } : {}),
				...(includeInactive ? {} : { isActive: true }),
			},
			orderBy: { order: "asc" },
		});
		return { success: true, data: faqs };
	} catch (error: unknown) {
		console.error("Error fetching FAQs:", error);
		return { success: false, error: "حدث خطأ أثناء جلب الأسئلة الشائعة" };
	}
}

// Add a new FAQ (Admin only)
export async function createFAQ(data: {
	question: string;
	answer: string;
	category: FAQCategory;
	isActive?: boolean;
	order?: number;
}): Promise<ActionResponse<FAQ>> {
	try {
		const validated = faqSchema.safeParse(data);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		await requireAuth([UserType.ADMIN]);

		const faq = await prisma.fAQ.create({
			data: {
				question: data.question,
				answer: data.answer,
				category: data.category,
				isActive: data.isActive ?? true,
				order: data.order ?? 0,
			},
		});

		revalidatePath("/dashboard/admin/faq");
		revalidatePath(`/dashboard/${data.category.toLowerCase()}/faq`);
		return { success: true, data: faq };
	} catch (error: unknown) {
		console.error("Error creating FAQ:", error);
		return { success: false, error: "حدث خطأ أثناء إضافة السؤال" };
	}
}

// Update an existing FAQ (Admin only)
export async function updateFAQ(
	id: string,
	data: Partial<{
		question: string;
		answer: string;
		category: FAQCategory;
		isActive: boolean;
		order: number;
	}>,
): Promise<ActionResponse<FAQ>> {
	try {
		const validatedId = faqIdSchema.safeParse({ id });
		if (!validatedId.success) {
			return { success: false, error: validatedId.error.issues[0].message };
		}

		const validatedData = faqUpdateSchema.safeParse(data);
		if (!validatedData.success) {
			return { success: false, error: validatedData.error.issues[0].message };
		}

		await requireAuth([UserType.ADMIN]);

		// Fetch old category to revalidate both old and new paths on recategorization
		const oldFaq = await prisma.fAQ.findUnique({
			where: { id },
			select: { category: true },
		});

		const faq = await prisma.fAQ.update({
			where: { id },
			data,
		});

		revalidatePath("/dashboard/admin/faq");
		if (oldFaq)
			revalidatePath(`/dashboard/${oldFaq.category.toLowerCase()}/faq`);
		revalidatePath(`/dashboard/${faq.category.toLowerCase()}/faq`);
		return { success: true, data: faq };
	} catch (error: unknown) {
		console.error("Error updating FAQ:", error);
		return { success: false, error: "حدث خطأ أثناء تحديث السؤال" };
	}
}

// Delete an FAQ (Admin only)
export async function deleteFAQ(id: string): Promise<ActionResponse> {
	try {
		const validated = faqIdSchema.safeParse({ id });
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		await requireAuth([UserType.ADMIN]);

		const faq = await prisma.fAQ.delete({
			where: { id },
		});

		revalidatePath("/dashboard/admin/faq");
		revalidatePath(`/dashboard/${faq.category.toLowerCase()}/faq`);
		return { success: true };
	} catch (error: unknown) {
		console.error("Error deleting FAQ:", error);
		return { success: false, error: "حدث خطأ أثناء حذف السؤال" };
	}
}
