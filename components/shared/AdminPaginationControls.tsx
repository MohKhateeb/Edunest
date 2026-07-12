"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { nextCursor?: string | null; hasCursor: boolean };

export default function AdminPaginationControls({ nextCursor, hasCursor }: Props) {
	const t = useTranslations('admin');
	const searchParams = useSearchParams();
	const pathname = usePathname();

	if (!nextCursor && !hasCursor) return null;

	const buildUrl = (cursor?: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (cursor) params.set('cursor', cursor);
		else params.delete('cursor');
		const qs = params.toString();
		return qs ? `${pathname}?${qs}` : pathname;
	};

	return (
		<div className="flex justify-between items-center mt-6 pt-4 border-t border-border/60">
			{hasCursor ? (
				<Link
					href={buildUrl(undefined)}
					className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
				>
					<ChevronRight className="w-4 h-4 rtl:rotate-180" />
					{t('admin_pagination_first_page')}
				</Link>
			) : <span />}
			{nextCursor ? (
				<Link
					href={buildUrl(nextCursor)}
					className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
				>
					{t('admin_pagination_next_page')}
					<ChevronLeft className="w-4 h-4 rtl:rotate-180" />
				</Link>
			) : <span />}
		</div>
	);
}
