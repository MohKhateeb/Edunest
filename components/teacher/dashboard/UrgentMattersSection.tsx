import { AlertCircle } from "lucide-react";
import Link from "next/link";

interface UrgentMattersSectionProps {
	isVerified: boolean;
	openDisputes: any[];
	urgentAlerts: any[];
}

export default function UrgentMattersSection({ isVerified, openDisputes, urgentAlerts }: UrgentMattersSectionProps) {
	if (openDisputes.length === 0 && isVerified && urgentAlerts.length === 0) {
		return null;
	}

	return (
		<div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-3xl p-6 shadow-sm">
			<h2 className="font-black text-lg text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
				<AlertCircle className="h-6 w-6" />
				تنبيهات هامة بحاجة لإجراء
			</h2>
			<div className="space-y-3">
				{!isVerified && (
					<div className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-2xl border border-red-100 dark:border-red-900/50">
						<div>
							<h3 className="font-bold text-sm text-foreground">ملفك الشخصي غير موثق بعد</h3>
							<p className="text-xs text-muted-foreground mt-1">
								لا يمكنك استقبال حجوزات جديدة أو الظهور في نتائج البحث حتى يتم توثيق ملفك.
							</p>
						</div>
						<Link
							href="/dashboard/teacher/profile"
							className="text-xs font-bold text-primary hover:underline whitespace-nowrap mr-4"
						>
							إكمال الملف
						</Link>
					</div>
				)}
				{openDisputes.map((dispute) => (
					<div
						key={dispute.id}
						className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-2xl border border-red-100 dark:border-red-900/50"
					>
						<div>
							<h3 className="font-bold text-sm text-foreground">
								نزاع مفتوح: جلسة {dispute.booking.student.name}
							</h3>
							<p className="text-xs text-muted-foreground mt-1">
								قام ولي الأمر بفتح نزاع حول الجلسة. يرجى الرد والتواصل مع الإدارة.
							</p>
						</div>
						<Link
							href={`/dashboard/disputes/${dispute.id}`}
							className="text-xs font-bold text-primary hover:underline whitespace-nowrap mr-4"
						>
							عرض النزاع والرد
						</Link>
					</div>
				))}
				{urgentAlerts.map((alert) => (
					<div
						key={alert.id}
						className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-white dark:bg-card p-4 rounded-2xl border border-orange-200 dark:border-orange-900/50"
					>
						<div>
							<h3
								className={`font-bold text-sm ${alert.type === "WARNING_2_FROZEN" ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}
							>
								{alert.type === "WARNING_2_FROZEN" ? "تجميد رصيد - تحذير نهائي!" : "تحذير تقرير متأخر"}
							</h3>
							<p className="text-xs text-muted-foreground mt-1 font-semibold">{alert.message}</p>
						</div>
						<Link
							href="/dashboard/teacher/pending-reports"
							className="shrink-0 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
						>
							الذهاب لكتابة التقارير
						</Link>
					</div>
				))}
			</div>
		</div>
	);
}
