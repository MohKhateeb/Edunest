import { DAYS_OF_WEEK_AR } from "@/lib/translations";

type AvailabilityItem = {
	dayOfWeek: number;
	startTime: string;
	endTime: string;
	isActive: boolean;
};

type AvailabilityViewerProps = {
	availability: AvailabilityItem[];
};

export default function AvailabilityViewer({
	availability,
}: AvailabilityViewerProps) {
	// Sort and group by dayOfWeek
	const activeAvailability = availability.filter((a) => a.isActive);

	const grouped = Array.from({ length: 7 }).map((_, dayNum) => {
		const slots = activeAvailability
			.filter((a) => a.dayOfWeek === dayNum)
			.sort((a, b) => a.startTime.localeCompare(b.startTime));
		return {
			dayNum,
			dayLabel: DAYS_OF_WEEK_AR[dayNum],
			slots,
		};
	});

	return (
		<div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
			<h3 className="font-extrabold text-base border-b border-border pb-2.5">
				ساعات العمل الأسبوعية المتاحة
			</h3>
			<div className="space-y-3">
				{grouped.map((group) => (
					<div
						key={group.dayNum}
						className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-border last:border-none gap-2 text-sm"
					>
						<span className="font-bold text-foreground/80 flex-shrink-0 w-24">
							{group.dayLabel}
						</span>
						<div className="flex flex-wrap gap-1.5 flex-1 justify-start sm:justify-end">
							{group.slots.length === 0 ? (
								<span className="text-xs text-muted-foreground bg-accent/40 px-2.5 py-1 rounded-lg">
									غير متاح
								</span>
							) : (
								group.slots.map((slot, index) => (
									<span
										key={`${slot.dayOfWeek}-${slot.startTime}-${index}`}
										className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium border border-primary/10"
									>
										{slot.startTime} - {slot.endTime}
									</span>
								))
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
