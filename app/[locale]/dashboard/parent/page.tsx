import { UserType } from "@prisma/client";
import { Bell } from "lucide-react";
import { requireAuth } from "@/lib/require-auth";
import { getParentDashboardInsights } from "@/lib/services/parent-dashboard";
import { getTranslations, setRequestLocale } from "next-intl/server";

import ActionCenter from "./_components/ActionCenter";
import SmartWidget from "./_components/SmartWidget";
import QuickActions from "./_components/QuickActions";
import TodayPulse from "./_components/TodayPulse";

export default async function ParentDashboard({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("parent");

	const { userId } = await requireAuth([UserType.PARENT]);
	
	const { auth } = await import("@/lib/auth");
	const session = await auth();
	const userName = session?.user?.name || t("key_1783109428865_gcaj");

	const insights = await getParentDashboardInsights(userId, userName, locale);

	return (
		<div className="space-y-8 text-start pb-10">
			
			{/* 1. Status Header & Quick Actions */}
			<div className="flex flex-col lg:flex-row gap-6 justify-between items-start mt-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-black text-slate-900 dark:text-white">
						{t("key_1783109428847_62xo")} {userName} 👋
					</h1>
					<p className="text-sm font-semibold text-muted-foreground">
						{insights.urgentActions.length === 0 
							? t("key_1783109428866_o3mz") 
							: t("urgent_tasks_count", { count: insights.urgentActions.length })}
					</p>
				</div>
				<div className="w-full lg:w-auto lg:min-w-[400px]">
					<QuickActions />
				</div>
			</div>

			{/* 2. Urgent Action Center */}
			{insights.urgentActions.length > 0 && (
				<div className="pt-2">
					<ActionCenter actions={insights.urgentActions} />
				</div>
			)}

			{/* 3. Main Content Layout (Pulse + Smart Widget) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
				
				{/* Right Column: Smart Widget & Today's Pulse */}
				<div className="lg:col-span-2 space-y-6">
					<SmartWidget 
						hakeemMessage={insights.hakeemMessage}
						najeebMessage={insights.najeebMessage}
						najeebMode={insights.najeebMode}
					/>

					<TodayPulse sessions={insights.todaySessions} />
				</div>

				{/* Left Column: Notifications */}
				<div className="space-y-4">
					<h2 className="font-black text-lg flex items-center gap-2">
						<Bell className="h-6 w-6 text-secondary" />
						{t("key_1783109428855_92o7")}
					</h2>

					<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-5 shadow-sm space-y-3">
						{insights.notifications.length === 0 ? (
							<p className="text-sm text-muted-foreground py-6 text-center font-semibold">
								{t("key_1783109428860_3a1a")}
							</p>
						) : (
							insights.notifications.map((n) => (
								<div
									key={n.id}
									className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border/50 transition-all hover:border-primary/30"
								>
									<div className="font-black text-foreground mb-1 text-sm">
										{n.title}
									</div>
									<p className="text-muted-foreground leading-relaxed text-xs font-medium">
										{n.message}
									</p>
									<span className="text-[10px] text-muted-foreground/60 block mt-2 font-bold">
										{new Date(n.createdAt).toLocaleDateString("ar-EG")}
									</span>
								</div>
							))
						)}
					</div>
				</div>
				
			</div>
		</div>
	);
}
