import { getTranslations } from "next-intl/server";
import { Loader2 } from "lucide-react";

export default async function DashboardLoading() {
    const t = await getTranslations('common')
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
			<Loader2 className="w-12 h-12 text-primary animate-spin" />
			<p className="text-muted-foreground font-medium animate-pulse">
				{t('key_1783109426061_tquh')}</p>
		</div>
	);
}
