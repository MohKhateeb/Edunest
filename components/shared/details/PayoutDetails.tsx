"use client";

import type { Prisma } from "@prisma/client";
import { FileText } from "lucide-react";
import React from "react";
import type { commonPayoutInclude } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type DetailedPayout = Omit<
	Prisma.TeacherPayoutGetPayload<{ include: typeof commonPayoutInclude }>,
	"bookings"
> & {
	bookings: (Prisma.BookingGetPayload<{
		include: typeof commonPayoutInclude.bookings.include;
	}> & {
		calculatedCommission: number;
		calculatedNetAmount: number;
	})[];
};

interface PayoutDetailsProps {
	payout: DetailedPayout;
}

export default function PayoutDetails({ payout }: PayoutDetailsProps) {
    const t = useTranslations('common');
	return (
		<div className="space-y-6 text-xs text-muted-foreground">
			{/* Payout Summary Card */}
			<div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center flex-wrap gap-4">
				<div>
					<span className="text-[10px] block font-mono">
						{t('rqm_mstnd_altswyh')}{payout.id.toUpperCase()}
					</span>
					<h3 className="text-base font-extrabold text-foreground mt-0.5">
						{t('msthqat_almalm_a')}{payout.teacher.user.name}
					</h3>
					<span className="text-[10px] text-muted-foreground block mt-1">
						{t('alftrh_almshmwlh')}{" "}
						{new Date(payout.periodStart).toLocaleDateString("ar-EG")} {t('ila')}{" "}
						{new Date(payout.periodEnd).toLocaleDateString("ar-EG")}
					</span>
				</div>
				<div className="text-right">
					<span className="text-[10px] text-muted-foreground block font-bold">
						{t('alhalh_almalyh')}</span>
					{payout.isPaid ? (
						<span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold px-3 py-1 rounded-full text-[10px] mt-1 inline-block">
							{t('tm_thwyl_almsthqat')}</span>
					) : (
						<span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 font-bold px-3 py-1 rounded-full text-[10px] mt-1 inline-block">
							{t('malq_bantdhar_althwyl_albnky')}</span>
					)}
				</div>
			</div>

			{/* Financial Numbers Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="p-4 border border-border bg-card rounded-xl text-center">
					<span className="text-[10px] text-muted-foreground block font-bold">
						{t('ijmaly_rswm_alhss')}</span>
					<span className="text-sm font-extrabold text-foreground">
						{formatPrice(Number(payout.totalAmount))}
					</span>
				</div>
				<div className="p-4 border border-border bg-card rounded-xl text-center text-rose-600 dark:text-rose-400">
					<span className="text-[10px] text-muted-foreground block font-bold">
						{t('khsm_amwlh_almnsh')}</span>
					<span className="text-sm font-extrabold">
						-{formatPrice(Number(payout.commissionAmount))}
					</span>
				</div>
				<div className="p-4 border border-border bg-card rounded-xl text-center text-purple-600 dark:text-purple-400">
					<span className="text-[10px] text-muted-foreground block font-bold">
						{t('tawyd_alhss_almjanyh')}</span>
					<span className="text-sm font-extrabold">
						+{formatPrice(Number(payout.trialCompensation))}
					</span>
				</div>
				<div className="p-4 border border-border bg-emerald-500/10 rounded-xl text-center text-primary font-bold">
					<span className="text-[10px] text-primary block font-bold">
						{t('alsafy_almhwl_llmalm')}</span>
					<span className="text-base font-extrabold">
						{formatPrice(Number(payout.netAmount))}
					</span>
				</div>
			</div>

			{/* Included Bookings Detail Table */}
			<div className="space-y-3">
				<h4 className="font-extrabold text-sm border-b border-border pb-2 text-primary flex items-center gap-1.5">
					<FileText className="h-4.5 w-4.5" />
					{t('tfasyl_aljlsat_almshmwlh_fy')}{payout.bookings.length})
				</h4>
				<div className="border border-border rounded-xl overflow-hidden bg-card">
					<table className="w-full text-right border-collapse text-xs">
						<thead>
							<tr className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
								<th className="p-3">{t('altalb_walkhdmh')}</th>
								<th className="p-3">{t('tarykh_wwqt_aljlsh')}</th>
								<th className="p-3">{t('rswm_alhsh')}</th>
								<th className="p-3">{t('alamwlh_almqttah')}</th>
								<th className="p-3 text-left">{t('almblgh_alsafy')}</th>
							</tr>
						</thead>
						<tbody>
							{payout.bookings.map((booking) => {
								const isFree = booking.isTrial;
								const commission = booking.calculatedCommission;
								const netAmount = booking.calculatedNetAmount;

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
													{t('mjanyh_tawyd')}{" "}
													{formatPrice(Number(booking.trialCostToPlatform))})
												</span>
											) : (
												<span>{formatPrice(Number(booking.price))}</span>
											)}
										</td>
										<td className="p-3 text-rose-600 dark:text-rose-400">
											{isFree
												? "-"
												: `-${formatPrice(commission)} (${Number(booking.appliedCommissionRate)}%)`}
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
