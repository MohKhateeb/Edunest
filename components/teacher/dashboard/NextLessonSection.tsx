import { Calendar } from "lucide-react";
import BookingCard from "@/components/shared/BookingCard";
import { useTranslations } from "next-intl";

interface NextLessonSectionProps {
	nextSession: any | null;
}

export default function NextLessonSection({ nextSession }: NextLessonSectionProps) {
    const t = useTranslations('dashboard');
	return (
		<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
			<h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
				<Calendar className="h-6 w-6 text-primary" />
				{t('aljlsh_almjdwlh_altalyh')}</h2>
			{nextSession ? (
				<BookingCard booking={nextSession} role="TEACHER" />
			) : (
				<div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
					<p className="text-sm text-muted-foreground font-semibold">{t('la_twjd_hss_mjdwlh')}</p>
				</div>
			)}
		</div>
	);
}
