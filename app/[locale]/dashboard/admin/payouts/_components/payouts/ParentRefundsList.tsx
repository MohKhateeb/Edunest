import { CheckCircle2, RefreshCcw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ParentRefundRecord } from "@/types/payout";
import { getTranslations } from "next-intl/server";

type ParentRefundsListProps = {
	parentRefunds: ParentRefundRecord[];
	handleMarkRefundAsPaid: (id: string) => void;
	loading: boolean;
};

export async function ParentRefundsList({
	parentRefunds,
	handleMarkRefundAsPaid,
	loading,
}: ParentRefundsListProps) {
    const t = await getTranslations('admin')
	return (
		<div>
			<div className="flex items-center gap-3 mb-6 mt-12">
				<div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
					<RefreshCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
				</div>
				<div>
					<h2 className="text-xl font-bold text-foreground">
						{t('key_1783109440013_ph0m')}</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{t('key_1783109440019_dq42')}</p>
				</div>
			</div>

			<div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
				{!parentRefunds || parentRefunds.length === 0 ? (
					<p className="text-sm text-muted-foreground py-12 text-center">
						{t('key_1783109440023_h3p5')}</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-end border-collapse text-sm">
							<thead>
								<tr className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
									<th className="p-4">{t('key_1783109440027_t81w')}</th>
									<th className="p-4">{t('key_1783109440051_izsi')}</th>
									<th className="p-4">{t('key_1783109440055_u4g2')}</th>
									<th className="p-4 text-start">{t('key_1783109430292_au5h')}</th>
								</tr>
							</thead>
							<tbody>
								{parentRefunds.map((r) => (
									<tr
										key={r.id}
										className="border-b border-border last:border-none hover:bg-accent/20 transition-colors"
									>
										<td className="p-4">
											<span className="font-bold text-foreground">
												{r.parentName}
											</span>
										</td>
										<td className="p-4 text-xs text-muted-foreground">
											{new Date(r.createdAt).toLocaleDateString("ar-EG")}
										</td>
										<td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
											{formatPrice(r.amount)}
										</td>
										<td className="p-4 text-start">
											<div className="flex items-center justify-end gap-3">
												{r.isPaid ? (
													<span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
														<CheckCircle2 className="w-3.5 h-3.5" />
														{t('key_1783109440063_0ckm')}</span>
												) : (
													<button
														type="button"
														onClick={() => handleMarkRefundAsPaid(r.id)}
														disabled={loading}
														className="bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer disabled:opacity-50"
													>
														{t('key_1783109440069_ubbe')}</button>
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
