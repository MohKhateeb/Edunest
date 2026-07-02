"use client";

import { EscrowResolution } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { resolveEscrow } from "@/lib/actions/admin-escrow";

export function EscrowActions({ escrowId }: { escrowId: string }) {
	const [isLoading, setIsLoading] = useState(false);

	async function handleResolve(resolution: EscrowResolution) {
		if (!confirm("هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.")) return;

		try {
			setIsLoading(true);
			await resolveEscrow(escrowId, resolution);
		} catch (error) {
			console.error(error);
			alert("حدث خطأ أثناء تنفيذ الإجراء");
		} finally {
			setIsLoading(false);
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span className="text-sm">جاري التنفيذ...</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col sm:flex-row gap-2 w-full">
			<button
				type="button"
				onClick={() => handleResolve(EscrowResolution.REFUNDED_TO_PARENT)}
				className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
			>
				إرجاع لولي الأمر
			</button>
			<button
				type="button"
				onClick={() => handleResolve(EscrowResolution.PAID_TO_TEACHER)}
				className="bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
			>
				دفع للمعلم
			</button>
			<button
				type="button"
				onClick={() => handleResolve(EscrowResolution.PLATFORM_PROFIT)}
				className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
			>
				تحويل لأرباح المنصة
			</button>
		</div>
	);
}
