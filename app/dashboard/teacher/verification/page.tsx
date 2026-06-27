import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import TeacherVerificationForm from "@/app/dashboard/teacher/_components/TeacherVerificationForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { UserService } from "@/lib/services/domain/user-service";

export default async function TeacherVerificationPage() {
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session) redirect("/login");

	const teacher = await UserService.getTeacherVerificationData(session.user.id);

	if (!teacher) {
		redirect("/dashboard/teacher");
	}

	const initialData = teacher.verification
		? {
				nationalIdUrl: teacher.verification.nationalIdUrl,
				degreeUrl: teacher.verification.degreeUrl,
				videoInterviewUrl: teacher.verification.videoInterviewUrl,
				reviewedAt: teacher.verification.reviewedAt,
				rejectionReason: teacher.verification.rejectionReason,
			}
		: null;

	return (
		<TeacherVerificationForm
			initialData={initialData}
			isVerified={teacher.isVerified}
		/>
	);
}
