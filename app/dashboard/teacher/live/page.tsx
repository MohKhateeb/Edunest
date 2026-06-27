import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import LiveRadar from "@/components/shared/LiveRadar";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SessionService } from "@/lib/services/domain/session-service";

export const dynamic = "force-dynamic";

export default async function TeacherLiveRadarPage() {
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session || session.user.userType !== "TEACHER") {
		redirect("/login");
	}

	const { teacher, liveRequests } = await SessionService.getTeacherLiveRadarData(session.user.id);

	return (
		<div className="space-y-6" dir="rtl">
			<div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
				<div>
					<h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
						الرادار الحي 📡
					</h1>
					<p className="text-slate-500 mt-2">
						التقط طلبات الفزعة الفورية للطلاب، وادخل الجلسة في ثوانٍ معدودة.
					</p>
				</div>

				<InteractiveMessage
					character="hakeem"
					message={
						teacher.isAvailableNow
							? "الرادار يعمل! أي طالب يطلب فزعة في مادتك سيظهر هنا. كن أسرع من يلتقطه!"
							: "لتفعيل الرادار واستقبال الطلبات، يجب عليك تفعيل خيار 'متاح الآن' من ملفك."
					}
					className="max-w-md"
				/>
			</div>

			<LiveRadar
				teacherId={teacher.id}
				initialRequests={liveRequests}
				isAvailableNow={teacher.isAvailableNow}
			/>
		</div>
	);
}
