import { Clock } from "lucide-react";
import BookingCard from "@/components/shared/BookingCard";

interface PendingRequestsSectionProps {
	pendingRequests: any[];
}

export default function PendingRequestsSection({ pendingRequests }: PendingRequestsSectionProps) {
	return (
		<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
			<h2 className="font-black text-lg flex items-center gap-2 border-b border-border pb-3">
				<Clock className="h-6 w-6 text-secondary" />
				طلبات حجز بانتظار ردك ({pendingRequests.length})
			</h2>
			{pendingRequests.length === 0 ? (
				<div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
					<p className="text-sm text-muted-foreground font-semibold">لا توجد طلبات حجز معلقة حالياً.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4">
					{pendingRequests.map((req) => (
						<BookingCard key={req.id} booking={req} role="TEACHER" />
					))}
				</div>
			)}
		</div>
	);
}
