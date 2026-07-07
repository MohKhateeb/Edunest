import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import AddStudentForm from "../_components/AddStudentForm";
import ParentStudentsList from "../_components/ParentStudentsList";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { UserService } from "@/lib/services/domain/user-service";

export default async function ParentStudentsPage() {
    const t = await getTranslations('parent')
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	const students = await UserService.getParentStudents(session.user.id);

	return (
		<div className="space-y-8 text-start pb-10">
			<div>
				<h1 className="text-2xl font-black mb-4 text-primary">
					{t('students_page_title')}</h1>
				<InteractiveMessage
					character="hakeem"
					message={t('students_intro_message')}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
				{/* Students List */}
				<div className="lg:col-span-2 space-y-4">
					<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
						<h2 className="font-black text-lg border-b border-border/50 pb-3 flex items-center gap-2">
							<Users className="h-6 w-6 text-secondary" />
							{t('students_list_title')}</h2>

						<ParentStudentsList students={students} />
					</div>
				</div>

				{/* Add Student Form with Najeeb inside Content */}
				<div className="space-y-6 lg:mt-0">
					<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-1 shadow-sm">
						<AddStudentForm />
					</div>

					<InteractiveMessage
						character="najeeb"
						najeebMode="study"
						message={t('students_intro_welcome')}
					/>
				</div>
			</div>
		</div>
	);
}
