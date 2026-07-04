import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import BookingSelectionCards from "@/components/shared/booking-journey/BookingSelectionCards";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewBookingPageRoute() {
    const t = await getTranslations('parent')
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	return (
		<div className="space-y-4 relative min-h-[500px]">
			{/* عنوان الصفحة (يظهر دائماً) */}
			<div className="text-center space-y-1 mb-8">
				<h1 className="text-3xl font-black text-slate-900 dark:text-white">
					{t('key_1783109439408_ghgg')}</h1>
				<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
					{t('key_1783109439410_4d1o')}</p>
			</div>

			<BookingSelectionCards />
		</div>
	);
}
