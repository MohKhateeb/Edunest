import type { Prisma } from "@prisma/client";
import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminVerificationQueue from "@/app/dashboard/admin/_components/AdminVerificationQueue";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const pendingVerificationInclude = {
	teacher: {
		select: {
			id: true,
			subjects: { include: { subject: true } },
			city: true,
			education: true,
			profileImageUrl: true,
			user: {
				select: { name: true, email: true },
			},
		},
	},
} satisfies Prisma.TeacherVerificationInclude;

type AdminVerificationRequest = Prisma.TeacherVerificationGetPayload<{
	include: typeof pendingVerificationInclude;
}>;

export default async function AdminVerificationPage() {
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	// Fetch pending verifications
	const pendingRequests: AdminVerificationRequest[] =
		await prisma.teacherVerification.findMany({
			where: { reviewedAt: null },
			include: pendingVerificationInclude,
			orderBy: { createdAt: "asc" },
		});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">
					طلبات توثيق ملفات المعلمين
				</h1>
				<p className="text-xs text-muted-foreground">
					راجع مستندات الهوية والشهادات العلمية المرفوعة من المعلمين لتفعيل
					حساباتهم وتوثيقها بbadge مناسب.
				</p>
			</div>

			<AdminVerificationQueue requests={pendingRequests} />
		</div>
	);
}
