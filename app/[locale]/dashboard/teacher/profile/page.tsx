import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import TeacherProfileForm from "../_components/TeacherProfileForm";
import TeacherSlugForm from "../_components/TeacherSlugForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { UserService } from "@/lib/services/domain/user-service";
import { locationRepository } from "@/lib/repositories/locationRepository";

export default async function TeacherProfilePage() {
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session) redirect("/login");

	const data = await UserService.getTeacherProfileData(session.user.id);
	if (!data?.teacher) redirect("/dashboard/profile");
	const { teacher, subjects, initialData } = data;

	const cities = await locationRepository.getActiveCitiesByCountry("PS");

	return (
		<div className="space-y-8">
			{teacher && (
				<TeacherSlugForm
					currentSlug={teacher.slug}
					slugUpdated={teacher.slugUpdated}
				/>
			)}
			<TeacherProfileForm initialData={initialData!} subjects={subjects} cities={cities} />
		</div>
	);
}
