import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import TeacherProfileForm from "@/app/dashboard/teacher/_components/TeacherProfileForm";
import TeacherSlugForm from "@/app/dashboard/teacher/_components/TeacherSlugForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { UserService } from "@/lib/services/domain/user-service";

export default async function TeacherProfilePage() {
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session) redirect("/login");

	const data = await UserService.getTeacherProfileData(session.user.id);
	if (!data?.teacher) redirect("/dashboard/profile");
	const { teacher, subjects, initialData } = data;

	return (
		<div className="space-y-8">
			{teacher && (
				<TeacherSlugForm
					currentSlug={teacher.slug}
					slugUpdated={teacher.slugUpdated}
				/>
			)}
			<TeacherProfileForm
				initialData={initialData!}
				subjects={subjects}
			/>
		</div>
	);
}
