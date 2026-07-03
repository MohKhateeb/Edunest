import { BadgeDollarSign, CheckCircle2, Printer, Receipt } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { PayoutRecord } from "@/types/payout";

type PayoutsHistoryListProps = {
	existingPayouts: PayoutRecord[];
	handlePrint: (p: PayoutRecord) => void;
	setSelectedPayoutId: (id: string) => void;
	handleMarkAsPaid: (id: string) => void;
	loading: boolean;
};

export function PayoutsHistoryList({
	existingPayouts,
	handlePrint,
	setSelectedPayoutId,
	handleMarkAsPaid,
	loading,
}: PayoutsHistoryListProps) {
	return (
		<div>
			<div className="flex items-center gap-3 mb-6 mt-12">
				<div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
					<BadgeDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
				</div>
				<div>
					<h2 className="text-xl font-bold text-foreground">
						سجل التسويات والفواتير
					</h2>
					<p className="text-sm text-muted-foreground mt-1">
						التسويات الصادرة سابقاً وحالتها المالية
					</p>
				</div>
			</div>

			<div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
				{existingPayouts.length === 0 ? (
					<p className="text-sm text-muted-foreground py-12 text-center flex flex-col items-center">
						<Receipt className="w-12 h-12 mb-3 text-muted-foreground/30" />
						لم يتم إصدار أي تسويات مالية بعد.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-right border-collapse text-sm">
							<thead>
								<tr className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
									<th className="p-4 whitespace-nowrap">رقم الفاتورة</th>
									<th className="p-4">المعلم المستفيد</th>
									<th className="p-4">الفترة الزمنية</th>
									<th className="p-4">الصافي</th>
									<th className="p-4 text-left">الحالة والإجراءات</th>
								</tr>
							</thead>
							<tbody>
								{existingPayouts.map((p) => (
									<tr
										key={p.id}
										className="border-b border-border last:border-none hover:bg-accent/20 transition-colors"
									>
										<td className="p-4 text-xs font-mono text-muted-foreground uppercase">
											#{p.id.slice(-6)}
										</td>
										<td className="p-4">
											<span className="font-bold text-foreground">
												{p.teacher.user.name}
											</span>
										</td>
										<td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
											{new Date(p.periodStart).toLocaleDateString("ar-EG")} -{" "}
											{new Date(p.periodEnd).toLocaleDateString("ar-EG")}
										</td>
										<td className="p-4 font-bold text-primary whitespace-nowrap">
											{formatPrice(p.netAmount)}
										</td>
										<td className="p-4 text-left">
											<div className="flex items-center justify-end gap-3">
												<button
													type="button"
													onClick={() => handlePrint(p)}
													className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent"
													title="طباعة الفاتورة"
												>
													<Printer className="w-4 h-4" />
												</button>
												<button
													type="button"
													onClick={() => setSelectedPayoutId(p.id)}
													className="text-xs font-semibold text-primary hover:underline px-2 py-1"
												>
													تفاصيل
												</button>
												{p.isPaid ? (
													<span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
														<CheckCircle2 className="w-3.5 h-3.5" />
														تم الدفع
													</span>
												) : (
													<button
														type="button"
														onClick={() => handleMarkAsPaid(p.id)}
														disabled={loading}
														className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer disabled:opacity-50"
													>
														تأكيد التحويل
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
