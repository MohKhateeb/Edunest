function Skeleton({ className }: { className?: string }) {
	return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function TableSkeleton() {
	return (
		<div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
			<div className="p-4 border-b border-border flex justify-between items-center">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-9 w-64 rounded-xl" />
			</div>
			<div className="p-0">
				<div className="w-full">
					<div className="border-b border-border bg-muted/30 p-4 flex gap-4">
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-4 w-1/4" />
					</div>
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="border-b border-border p-4 flex gap-4 items-center"
						>
							<Skeleton className="h-5 w-1/4" />
							<Skeleton className="h-5 w-1/4" />
							<Skeleton className="h-5 w-1/4" />
							<div className="w-1/4 flex gap-2">
								<Skeleton className="h-8 w-16 rounded-lg" />
								<Skeleton className="h-8 w-16 rounded-lg" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function CardSkeleton() {
	return (
		<div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
			<div className="flex justify-between items-start">
				<Skeleton className="h-6 w-24 rounded-full" />
				<div className="flex flex-col items-end gap-1">
					<Skeleton className="h-3 w-12" />
					<Skeleton className="h-5 w-16" />
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-y border-border py-4 my-1">
				<div className="space-y-3">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="h-4 w-2/3" />
				</div>
				<div className="space-y-3">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="h-4 w-2/3" />
				</div>
			</div>
			<div className="flex justify-end gap-2 pt-2">
				<Skeleton className="h-9 w-24 rounded-lg" />
				<Skeleton className="h-9 w-24 rounded-lg" />
			</div>
		</div>
	);
}

export function ProfileSkeleton() {
	return (
		<div className="bg-card border border-border rounded-xl p-8 space-y-6 shadow-sm">
			<div className="border-b border-border pb-4">
				<Skeleton className="h-7 w-48" />
			</div>
			<div className="flex items-center gap-6">
				<Skeleton className="h-24 w-24 rounded-2xl" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-40 rounded-lg" />
					<Skeleton className="h-3 w-32" />
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full rounded-xl" />
					</div>
				))}
			</div>
		</div>
	);
}
