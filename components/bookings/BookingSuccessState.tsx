import { CheckCircle } from "lucide-react";

interface BookingSuccessStateProps {
	isTrial?: boolean;
}

export function BookingSuccessState({ isTrial }: BookingSuccessStateProps) {
	return (
		<div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
			<div className="text-center py-8 space-y-3">
				<div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
					<CheckCircle className="h-10 w-10" />
				</div>
				<h2 className="text-xl font-bold">
					{isTrial ? "تم تأكيد حجزك التجريبي بنجاح!" : "تم إرسال طلب الحجز، بانتظار موافقة المعلم"}
				</h2>
				<p className="text-xs text-muted-foreground">
					{isTrial ? "يتم نقلك الآن إلى قائمة حجوزاتك..." : "سيتم إشعارك فور رد المعلم. يتم نقلك الآن..."}
				</p>
			</div>
		</div>
	);
}
