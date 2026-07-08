import { getTranslations } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminVerificationQueue from "../_components/AdminVerificationQueue";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";

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

export default async function AdminVerificationPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const t = await getTranslations('admin')
	const resolvedParams = await searchParams;
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const cursor = resolvedParams.cursor as string | undefined;
	const { items: pendingRequests, nextCursor } = await SystemAdminService.getAdminVerifications({ cursor });
	// TODO: wire up pagination UI

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">
					{t('verification_page_title')}</h1>
				<p className="text-xs text-muted-foreground">
					{t('verification_page_subtitle')}
				</p>
			</div>

			<AdminVerificationQueue requests={pendingRequests} />
		</div>
	);
}
