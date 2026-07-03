"use client";

import { Clock, PlayCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import type { DetailedBooking } from "@/lib/types";
import { formatTimeOnly } from "@/lib/utils/time";
import DetailsModal from "@/components/shared/DetailsModal";
import NajeebCharacter from "@/components/shared/NajeebCharacter";

interface TodayPulseProps {
	sessions: DetailedBooking[];
}

export default function TodayPulse({ sessions }: TodayPulseProps) {
	const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

	if (!sessions || sessions.length === 0) {
		return (
			<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 text-center shadow-sm">
				<p className="text-sm text-muted-foreground font-semibold">
					لا توجد جلسات مجدولة لهذا اليوم.
				</p>
			</div>
		);
	}

	const now = new Date();

	return (
		<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
			{/* Header area with Najeeb character encouraging the parent */}
			<div className="flex flex-col sm:flex-row items-center gap-4 mb-8 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
				<div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
					<NajeebCharacter size="xs" mode="study" animated={true} />
				</div>
				<div className="text-center sm:text-right">
					<h2 className="text-lg font-black text-emerald-800 dark:text-emerald-400">
						نبض اليوم
					</h2>
					<p className="text-sm font-semibold text-emerald-700/80 dark:text-emerald-300/80 mt-1">
						بطلنا لديه جلسات ممتعة اليوم، استمروا في هذا التألق، اضغط على الجلسة لمتابعة التفاصيل!
					</p>
				</div>
			</div>

			<div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
				{sessions.map((session) => {
					const startUtc = new Date(session.startTime);
					const endTime = new Date(startUtc.getTime() + session.duration * 60000);
					const isPast = endTime < now;
					const isOngoing = startUtc <= now && endTime >= now;
					const isFuture = startUtc > now;

					let statusColor = "bg-slate-200 dark:bg-slate-700 text-slate-500";
					let StatusIcon = Clock;
					let borderColor = "border-transparent";

					if (isOngoing) {
						statusColor = "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
						StatusIcon = PlayCircle;
						borderColor = "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
					} else if (isPast) {
						statusColor = "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
						StatusIcon = CheckCircle2;
					} else if (isFuture) {
						statusColor = "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
					}

					return (
						<div key={session.id} className="relative flex items-center justify-between md:justify-start md:odd:justify-end group is-active py-2">
							{/* Icon */}
							<div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 ${statusColor} shrink-0 z-10 md:absolute md:left-1/2 md:-translate-x-1/2`}>
								{isOngoing && <span className="absolute w-full h-full rounded-full bg-green-400 animate-ping opacity-50"></span>}
								<StatusIcon className="w-4 h-4 relative z-10" />
							</div>

							{/* Card - Clickable */}
							<button 
								onClick={() => setSelectedBookingId(session.id)}
								className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-border/50 hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-right cursor-pointer shadow-sm hover:shadow group-hover:-translate-y-1"
							>
								<div className="flex items-center justify-between mb-2">
									<span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isOngoing ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : isPast ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400" : "bg-primary/10 text-primary"}`}>
										{isOngoing ? "جارية الآن" : isPast ? "مكتملة" : "قادمة"}
									</span>
									<span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
										<Clock className="w-3.5 h-3.5" />
										{formatTimeOnly(session.startTime)}
									</span>
								</div>
								
								<h3 className="font-bold text-sm text-foreground mb-1">
									{session.teacherService.serviceType.name}
								</h3>
								<p className="text-xs text-muted-foreground font-medium line-clamp-1">
									الطالب: <span className="font-bold text-slate-700 dark:text-slate-300">{session.student.name}</span> • المعلم: <span className="font-bold text-slate-700 dark:text-slate-300">{session.teacherService.teacher.user.name}</span>
								</p>
							</button>
						</div>
					);
				})}
			</div>

			<DetailsModal
				isOpen={!!selectedBookingId}
				onClose={() => setSelectedBookingId(null)}
				entityType="booking"
				entityId={selectedBookingId}
			/>
		</div>
	);
}
