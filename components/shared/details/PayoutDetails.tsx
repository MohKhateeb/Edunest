"use client";

import { FileText } from "lucide-react";
import React from "react";
import { formatPrice } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import type { commonPayoutInclude } from "@/lib/types";

export type DetailedPayout = Prisma.TeacherPayoutGetPayload<{ include: typeof commonPayoutInclude }>;

interface PayoutDetailsProps {
	payout: DetailedPayout;
}

export default function PayoutDetails({ payout }: PayoutDetailsProps) {
	return (
		<div className="space-y-6 text-xs text-muted-foreground">
			{/* Payout Summary Card */}
			<div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center flex-wrap gap-4">
				<div>
					<span className="text-[10px] block font-mono">
						رقم مستند التسوية: #{payout.id.toUpperCase()}
					</span>
					<h3 className="text-base font-extrabold text-foreground mt-0.5">
						مستحقات المعلم: أ. {payout.teacher.user.name}
					</h3>
					<span className="text-[10px] text-muted-foreground block mt-1">
						الفترة المشمولة:{" "}
						{new Date(payout.periodStart).toLocaleDateString("ar-EG")} إلى{" "}
						{new Date(payout.periodEnd).toLocaleDateString("ar-EG")}
					</span>
				</div>
				<div className="text-right">
					<span className="text-[10px] text-muted-foreground block font-bold">
						الحالة المالية
					</span>
					{payout.isPaid ? (
						<span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold px-3 py-1 rounded-full text-[10px] mt-1 inline-block">
							تم تحويل المستحقات ✓
						</span>
					) : (
						<span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 font-bold px-3 py-1 rounded-full text-[10px] mt-1 inline-block">
							معلق بانتظار التحويل البنكي
						</span>
					)}
				</div>
			</div>

			{/* Financial Numbers Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="p-4 border border-border bg-card rounded-xl text-center">
					<span className="text-[10px] text-muted-foreground block font-bold">
						إجمالي رسوم الحصص
					</span>
					<span className="text-sm font-extrabold text-foreground">
						{formatPrice(Number(payout.totalAmount))}
					</span>
				</div>
				<div className="p-4 border border-border bg-card rounded-xl text-center text-rose-600 dark:text-rose-400">
					<span className="text-[10px] text-muted-foreground block font-bold">
						خصم عمولة المنصة
					</span>
					<span className="text-sm font-extrabold">
						-{formatPrice(Number(payout.commissionAmount))}
					</span>
				</div>
				<div className="p-4 border border-border bg-card rounded-xl text-center text-purple-600 dark:text-purple-400">
					<span className="text-[10px] text-muted-foreground block font-bold">
						تعويض الحصص المجانية
					</span>
					<span className="text-sm font-extrabold">
						+{formatPrice(Number(payout.trialCompensation))}
					</span>
				</div>
				<div className="p-4 border border-border bg-emerald-500/10 rounded-xl text-center text-primary font-bold">
					<span className="text-[10px] text-primary block font-bold">
						الصافي المحول للمعلم
					</span>
					<span className="text-base font-extrabold">
						{formatPrice(Number(payout.netAmount))}
					</span>
				</div>
			</div>

			{/* Included Bookings Detail Table */}
			<div className="space-y-3">
				<h4 className="font-extrabold text-sm border-b border-border pb-2 text-primary flex items-center gap-1.5">
					<FileText className="h-4.5 w-4.5" />
					تفاصيل الجلسات المشمولة في هذه الفاتورة ({payout.bookings.length})
				</h4>
				<div className="border border-border rounded-xl overflow-hidden bg-card">
					<table className="w-full text-right border-collapse text-xs">
						<thead>
							<tr className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
								<th className="p-3">الطالب والخدمة</th>
								<th className="p-3">تاريخ ووقت الجلسة</th>
								<th className="p-3">رسوم الحصة</th>
								<th className="p-3">العمولة المقتطعة</th>
								<th className="p-3 text-left">المبلغ الصافي</th>
							</tr>
						</thead>
						<tbody>
							{payout.bookings.map((booking) => {
								const price = Number(booking.price);
								const isFree = booking.isTrial;
								const commRate = Number(booking.appliedCommissionRate);
								const commission = isFree ? 0 : (price * commRate) / 100;
								const netAmount = isFree
									? Number(booking.trialCostToPlatform)
									: price - commission;

								return (
									<tr
										key={booking.id}
										className="border-b border-border last:border-none hover:bg-accent/20"
									>
										<td className="p-3">
											<span className="font-bold text-foreground/80 block">
												{booking.student.name}
											</span>
											<span className="text-[10px] text-muted-foreground">
												{booking.teacherService.serviceType.name}
											</span>
										</td>
										<td className="p-3 text-muted-foreground">
											{new Date(booking.startTime).toLocaleDateString("ar-EG")}{" "}
											-{" "}
											{new Date(booking.startTime).toLocaleTimeString("ar-EG", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</td>
										<td className="p-3">
											{isFree ? (
												<span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
													مجانية (تعويض:{" "}
													{formatPrice(Number(booking.trialCostToPlatform))})
												</span>
											) : (
												<span>{formatPrice(price)}</span>
											)}
										</td>
										<td className="p-3 text-rose-600 dark:text-rose-400">
											{isFree
												? "-"
												: `-${formatPrice(commission)} (${commRate}%)`}
										</td>
										<td className="p-3 font-bold text-foreground text-left">
											{formatPrice(netAmount)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
