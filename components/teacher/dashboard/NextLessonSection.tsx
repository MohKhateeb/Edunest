import { Calendar } from "lucide-react";
import BookingCard from "@/components/shared/BookingCard";

interface NextLessonSectionProps {
	nextSession: any | null;
}

export default function NextLessonSection({ nextSession }: NextLessonSectionProps) {
	return (
		<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
			<h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
				<Calendar className="h-6 w-6 text-primary" />
				الجلسة المجدولة التالية
			</h2>
			{nextSession ? (
				<BookingCard booking={nextSession} role="TEACHER" />
			) : (
				<div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
					<p className="text-sm text-muted-foreground font-semibold">لا توجد حصص مجدولة قادمة.</p>
				</div>
			)}
		</div>
	);
}
