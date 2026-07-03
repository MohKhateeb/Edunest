import { DollarSign } from "lucide-react";
import TeacherEarningsChart from "@/components/shared/charts/TeacherEarningsChart";
import { useTranslations } from "next-intl";

interface EarningsChartSectionProps {
	chartData: any;
}

export default function EarningsChartSection({ chartData }: EarningsChartSectionProps) {
    const t = useTranslations('dashboard');
	return (
		<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
			<div className="flex items-center justify-between border-b border-border pb-3 mb-4">
				<h2 className="font-black text-lg flex items-center gap-2">
					<DollarSign className="h-6 w-6 text-primary" />
					{t('nshatk_almaly_akhr_7')}</h2>
			</div>
			<TeacherEarningsChart data={chartData} />
		</div>
	);
}
