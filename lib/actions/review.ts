"use server";

import { getErrorT } from "@/lib/i18n/get-server-translations";
import { UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { authorizeBookingReview } from "@/lib/auth/authorization";
import type { ActionResponse } from "@/lib/types";

const reviewSchema = z.object({
	bookingId: z.string().min(1),
	rating: z.coerce
		.number()
		.int()
		.min(1)
		.max(5, "Rating must be between 1 and 5"),
	comment: z.string().optional().nullable(),
});

export async function submitReview(
	data: z.infer<typeof reviewSchema>,
): Promise<ActionResponse> {
	try {
		const { userId, userType } = await requireAuth([
			UserType.PARENT,
			UserType.ADMIN,
		]);

		const validated = reviewSchema.safeParse(data);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const { bookingId, rating, comment } = validated.data;

		// Fetch the booking to verify ownership and status
		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			include: {
				teacherService: {
					include: {
						teacher: {
							select: { id: true, slug: true },
						},
					},
				},
			},
		});

		if (!booking) {
			const tError = await getErrorT();
		return { success: false, error: tError("review_booking_not_found") };
		}

		// Check if the user is authorized to review this booking (must be the parent who made it, or admin)
		const auth = authorizeBookingReview(booking, userId, userType);
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		// Verify booking status is COMPLETED
		if (booking.status !== "COMPLETED") {
			const tError = await getErrorT();
		return { success: false, error: tError("review_only_completed_bookings") };
		}

		// Check if a review already exists
		const existing = await prisma.review.findUnique({
			where: { bookingId },
		});

		if (existing) {
			const tError = await getErrorT();
		return { success: false, error: tError("review_already_submitted") };
		}

		const teacherId = booking.teacherService.teacherId;

		// Perform inside transaction to update review and aggregate rating
		await prisma.$transaction(async (tx) => {
			// Create review
			await tx.review.create({
				data: {
					bookingId,
					teacherId,
					rating,
					comment,
				},
			});

			// Get new rating averages
			const aggregates = await tx.review.aggregate({
				where: { teacherId, isVisible: true },
				_avg: { rating: true },
				_count: { id: true },
			});

			// Update teacher profile with average rating and total reviews count
			await tx.teacher.update({
				where: { id: teacherId },
				data: {
					averageRating: aggregates._avg.rating || 0,
					totalReviews: aggregates._count.id || 0,
				},
			});
		});

		// Revalidate paths
		const slug = booking.teacherService.teacher?.slug;

		if (slug) {
			revalidatePath(`/teachers/${slug}`);
		}
		revalidatePath("/dashboard/parent/bookings");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		const msg =
			err instanceof Error ? err.message : await (async () => { const t = await getErrorT(); return t("review_submit_error"); })();
		return { success: false, error: msg };
	}
}
