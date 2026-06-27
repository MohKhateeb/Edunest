import { UserType } from "@prisma/client";
import AdminPayoutsEngine from "@/app/dashboard/admin/payouts/_components/AdminPayoutsEngine";
import { requireAuth } from "@/lib/require-auth";
import { getAdminPayoutsData } from "@/lib/services/domain/financial-service";

export default async function AdminPayoutsPage() {
	await requireAuth([UserType.ADMIN]);

	const { unpaidBookings, mappedPayouts, mappedRefunds } = await getAdminPayoutsData();

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 p-6 rounded-3xl border border-orange-100 dark:border-orange-900/30">
				<h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 mb-2">
					تسويات المعلمين واستردادات أولياء الأمور
				</h1>
				<p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
					قم بتجميع عمولات وحصص كل معلم في المنصة خلال فترات الفوترة، وقم برد
					المبالغ المستحقة لأولياء الأمور بعد حسم النزاعات لصالحهم.
				</p>
			</div>

			<AdminPayoutsEngine
				unpaidBookings={unpaidBookings}
				existingPayouts={mappedPayouts}
				parentRefunds={mappedRefunds}
			/>
		</div>
	);
}
