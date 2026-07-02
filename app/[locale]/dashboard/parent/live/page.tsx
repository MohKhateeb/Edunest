import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import ParentLiveRadarClient from "@/components/shared/ParentLiveRadarClient";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SessionService } from "@/lib/services/domain/session-service";

export const dynamic = "force-dynamic";

export default async function ParentLiveRadarPage() {
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session || session.user.userType !== "PARENT") {
		redirect("/login");
	}

	const { students, serviceTypes, subjects } =
		await SessionService.getParentLiveRadarData(session.user.id);

	if (students.length === 0) {
		redirect("/dashboard/profile");
	}

	return (
		<div className="space-y-6" dir="rtl">
			<ParentLiveRadarClient
				students={students}
				serviceTypes={serviceTypes}
				subjects={subjects}
			/>
		</div>
	);
}
