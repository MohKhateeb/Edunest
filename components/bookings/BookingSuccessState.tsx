import { CheckCircle } from "lucide-react";

export function BookingSuccessState() {
	return (
		<div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
			<div className="text-center py-8 space-y-3">
				<div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
					<CheckCircle className="h-10 w-10" />
				</div>
				<h2 className="text-xl font-bold">تم إرسال طلب الحجز بنجاح!</h2>
				<p className="text-xs text-muted-foreground">
					بانتظار موافقة المعلم وتأكيد الحجز. يتم نقلك الآن...
				</p>
			</div>
		</div>
	);
}
