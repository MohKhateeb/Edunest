import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { User } from "lucide-react";
import { redirect } from "next/navigation";
import PersonalProfileForm from "@/components/shared/PersonalProfileForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { UserService } from "@/lib/services/domain/user-service";

export default async function PersonalProfilePage() {
    const t = await getTranslations('common')
	const session = await auth();
	await requireAuth([UserType.ADMIN, UserType.TEACHER, UserType.PARENT]);
	if (!session) redirect("/login");

	const user = await UserService.getUserProfile(session.user.id);

	if (!user) {
		redirect("/login");
	}

	return (
		<div className="space-y-6 text-start">
			<div>
				<h1 className="text-2xl font-black mb-1.5 text-primary flex items-center gap-2">
					<User className="h-7 w-7" />
					{t('profile_title')}</h1>
				<p className="text-xs text-muted-foreground">
					{t('profile_description')}
				</p>
			</div>

			<PersonalProfileForm initialUser={user} />
		</div>
	);
}
