import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AvailabilityForm from "@/components/shared/AvailabilityForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { UserService } from "@/lib/services/domain/user-service";

export default async function TeacherAvailabilityPage() {
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session) redirect("/login");

	const data = await UserService.getTeacherAvailability(session.user.id);
	if (!data) redirect("/dashboard/profile");
	const { teacher, availability } = data;

	return <AvailabilityForm initialAvailability={availability} />;
}
