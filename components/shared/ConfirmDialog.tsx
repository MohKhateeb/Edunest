"use client";

import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import Portal from "@/components/shared/Portal";

interface ConfirmDialogProps {
	isOpen: boolean;
	title: string;
	description?: string;
	requireReason?: boolean;
	reasonLabel?: string;
	confirmLabel?: string;
	onConfirm: (reason?: string) => void;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function ConfirmDialog({
	isOpen,
	title,
	description,
	requireReason = false,
	reasonLabel = "سبب الإجراء",
	confirmLabel = "تأكيد",
	onConfirm,
	onCancel,
	isLoading = false,
}: ConfirmDialogProps) {
	const [reason, setReason] = useState("");

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (requireReason && !reason.trim()) return;
		onConfirm(reason);
	};

	return (
		<Portal>
			<div
				className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 overflow-y-auto animate-in fade-in duration-200"
				dir="rtl"
			>
				<div
					className="w-full max-w-md relative bg-card border border-border rounded-2xl shadow-2xl p-1 animate-in zoom-in-95 duration-200 my-8"
					onClick={(e) => e.stopPropagation()}
				>
					<button
						type="button"
						onClick={onCancel}
						disabled={isLoading}
						className="absolute top-4 end-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border bg-card shadow-xs"
						aria-label="إغلاق النافذة"
					>
						<X className="h-5 w-5" />
					</button>

					<form
						onSubmit={handleSubmit}
						className="bg-card rounded-xl p-6 space-y-5"
					>
						<h4 className="font-extrabold text-lg text-foreground flex items-center gap-2 border-b border-border/50 pb-3 pt-2 pr-2">
							{title}
						</h4>

						<div className="space-y-4">
							{description && (
								<p className="text-sm font-medium text-muted-foreground">
									{description}
								</p>
							)}

							{requireReason && (
								<div className="space-y-1.5">
									<label className="block text-xs font-bold text-muted-foreground">
										{reasonLabel} *
									</label>
									<textarea
										required
										rows={3}
										value={reason}
										onChange={(e) => setReason(e.target.value)}
										disabled={isLoading}
										placeholder="الرجاء توضيح السبب هنا..."
										className="w-full premium-input text-sm resize-none bg-background/50 border-border"
									/>
								</div>
							)}
						</div>

						<div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border">
							<button
								type="button"
								onClick={onCancel}
								disabled={isLoading}
								className="text-xs font-bold border border-border bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground px-5 py-2.5 rounded-xl transition-colors"
							>
								تراجع وإلغاء
							</button>
							<button
								type="submit"
								disabled={isLoading || (requireReason && !reason.trim())}
								className="text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading && (
									<span className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
								)}
								{confirmLabel}
							</button>
						</div>
					</form>
				</div>
			</div>
		</Portal>
	);
}
