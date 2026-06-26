import { Check, CheckCircle2, Receipt, Users } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { UnpaidBooking } from "@/types/payout";

export type TeacherGroup = {
	teacherId: string;
	teacherName: string;
	bookings: UnpaidBooking[];
	totalNet: number;
	totalCount: number;
};

type PendingTeachersListProps = {
	groupedByTeacher: TeacherGroup[];
	selectedTeacherId: string | null;
	handleSelectTeacher: (teacherId: string) => void;
};

export function PendingTeachersList({
	groupedByTeacher,
	selectedTeacherId,
	handleSelectTeacher,
}: PendingTeachersListProps) {
	return (
		<div>
			<div className="flex items-center gap-3 mb-6">
				<div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
					<Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
				</div>
				<div>
					<h2 className="text-xl font-bold text-foreground">
						معلمون بانتظار التسوية
					</h2>
					<p className="text-sm text-muted-foreground mt-1">
						اختر معلماً لمراجعة حصصه غير المسددة وإصدار التسوية
					</p>
				</div>
			</div>

			{groupedByTeacher.length === 0 ? (
				<div className="bg-card border border-border border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
					<div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
						<CheckCircle2 className="w-8 h-8 text-emerald-500" />
					</div>
					<h3 className="text-lg font-bold mb-2">جميع الحسابات مسواة</h3>
					<p className="text-sm text-muted-foreground max-w-sm">
						لا يوجد حالياً أي معلم لديه حصص معلقة وبانتظار التسوية.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{groupedByTeacher.map((g) => (
						<button
							type="button"
							key={g.teacherId}
							onClick={() => handleSelectTeacher(g.teacherId)}
							className={cn(
								"text-right flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group outline-none",
								selectedTeacherId === g.teacherId
									? "border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 shadow-md ring-2 ring-orange-500/20 scale-[1.02]"
									: "border-border bg-card hover:border-orange-300 dark:hover:border-orange-700/50 hover:shadow-sm",
							)}
						>
							<div className="flex justify-between items-start w-full mb-4">
								<div className="flex-1">
									<h3 className="font-bold text-base line-clamp-1">
										{g.teacherName}
									</h3>
									<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
										<Receipt className="w-3.5 h-3.5" />
										{g.totalCount} حصص غير مسواة
									</p>
								</div>
								{selectedTeacherId === g.teacherId && (
									<div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
										<Check className="w-4 h-4 text-white" />
									</div>
								)}
							</div>
							<div className="w-full pt-4 border-t border-border/50">
								<p className="text-xs text-muted-foreground mb-1">
									إجمالي المستحقات المتوقعة
								</p>
								<p className="font-extrabold text-lg text-primary">
									{formatPrice(g.totalNet)}
								</p>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
