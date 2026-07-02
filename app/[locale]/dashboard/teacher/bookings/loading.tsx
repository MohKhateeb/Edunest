import { CardSkeleton } from "@/components/shared/Skeletons";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div>
				<div className="h-8 w-48 bg-muted animate-pulse rounded-lg mb-2" />
				<div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
			</div>
			<div className="flex gap-4">
				<div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
				<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
			</div>
			<div className="space-y-4">
				<CardSkeleton />
				<CardSkeleton />
				<CardSkeleton />
			</div>
		</div>
	);
}
