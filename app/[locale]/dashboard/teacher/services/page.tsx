import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import TeacherServicesForm from "@/app/dashboard/teacher/_components/TeacherServicesForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { UserService } from "@/lib/services/domain/user-service";

export default async function TeacherServicesPage() {
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session) redirect("/login");

	const data = await UserService.getTeacherServicesData(session.user.id);
	if (!data) redirect("/dashboard/profile");
	const { teacher, mappedServices, serviceTypes } = data;

	return (
		<TeacherServicesForm
			serviceTypes={serviceTypes}
			configuredServices={mappedServices}
		/>
	);
}
