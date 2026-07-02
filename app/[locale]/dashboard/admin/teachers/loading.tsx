import { TableSkeleton } from "@/components/shared/Skeletons";

export default function Loading() {
	return (
		<div className="space-y-6">
			<div>
				<div className="h-8 w-48 bg-muted animate-pulse rounded-lg mb-2" />
				<div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
			</div>
			<TableSkeleton />
		</div>
	);
}
