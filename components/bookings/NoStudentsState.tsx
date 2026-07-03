import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function NoStudentsState() {
    const t = useTranslations('bookings');
	const router = useRouter();
	return (
		<div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto space-y-4">
			<AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
			<h3 className="font-extrabold text-lg">{t('lm_tqm_bidafh_tlab')}</h3>
			<p className="text-xs text-muted-foreground">
				{t('yjb_alyk_idafh_talb')}</p>
			<button
				type="button"
				onClick={() => router.push("/dashboard/parent/students")}
				className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer"
			>
				{t('athhb_lidafh_talb')}</button>
		</div>
	);
}
