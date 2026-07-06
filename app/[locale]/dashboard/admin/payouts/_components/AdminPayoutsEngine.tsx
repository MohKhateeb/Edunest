"use client";
import { useTranslations } from "next-intl";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import DetailsModal from "@/components/shared/DetailsModal";
import {
	createTeacherPayout,
	markParentRefundAsPaid,
	markPayoutAsPaid,
} from "@/lib/actions/payout";
import type { AdminPayoutsData } from "@/lib/services/domain/financial-service";
import type { ParentRefundRecord, PayoutRecord } from "@/types/payout";
import { DraftPayoutSection } from "./payouts/DraftPayoutSection";
import { ParentRefundsList } from "./payouts/ParentRefundsList";
import { PayoutsHistoryList } from "./payouts/PayoutsHistoryList";
import { PendingTeachersList } from "./payouts/PendingTeachersList";
import { PrintInvoice } from "./payouts/PrintInvoice";

type AdminPayoutsEngineProps = {
	teacherGroups: AdminPayoutsData["teacherGroups"];
	existingPayouts: PayoutRecord[];
	parentRefunds: ParentRefundRecord[];
};

export default function AdminPayoutsEngine({
	teacherGroups,
	existingPayouts,
	parentRefunds,
}: AdminPayoutsEngineProps) {
    const t = useTranslations('admin')
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

	const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(
		null,
	);
	const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(
		new Set(),
	);

	const [payoutToPrint, setPayoutToPrint] = useState<PayoutRecord | null>(null);

	const groupedByTeacher = teacherGroups;

	const handleSelectGroup = (groupKey: string) => {
		setSelectedGroupKey(groupKey);
		setErrorMsg(null);
		setSuccessMsg(null);
		const teacherGroup = groupedByTeacher.find(
			(g) => `${g.teacherId}:${g.currency}` === groupKey,
		);
		if (teacherGroup) {
			setSelectedBookingIds(new Set(teacherGroup.bookings.map((b) => b.id)));
		}
	};

	const handleToggleBooking = (bookingId: string) => {
		setSelectedBookingIds((prev) => {
			const next = new Set(prev);
			if (next.has(bookingId)) next.delete(bookingId);
			else next.add(bookingId);
			return next;
		});
	};

	const draftResult = useMemo(() => {
		if (!selectedGroupKey) return null;
		const teacher = groupedByTeacher.find(
			(g) => `${g.teacherId}:${g.currency}` === selectedGroupKey,
		);
		if (!teacher) return null;

		let totalAmount = 0;
		let commissionAmount = 0;
		let trialCompensation = 0;
		let netAmount = 0;
		let count = 0;

		for (const b of teacher.bookings) {
			if (selectedBookingIds.has(b.id)) {
				count++;
				totalAmount += b.totalAmount;
				commissionAmount += b.commissionAmount;
				trialCompensation += b.trialCompensation;
				netAmount += b.netEarnings;
			}
		}

		return {
			bookingCount: count,
			totalAmount,
			commissionAmount,
			trialCompensation,
			netAmount,
		};
	}, [selectedGroupKey, groupedByTeacher, selectedBookingIds]);

	const handleIssuePayout = async () => {
		if (!selectedGroupKey || !draftResult || draftResult.bookingCount === 0)
			return;

		setLoading(true);
		setErrorMsg(null);
		setSuccessMsg(null);

		const teacherId = selectedGroupKey.split(':')[0];
		const res = await createTeacherPayout({
			teacherId,
			bookingIds: Array.from(selectedBookingIds),
		});

		setLoading(false);

		if (res.success) {
			setSuccessMsg(t('key_1783109439391_9mqi'));
			setSelectedGroupKey(null);
			setSelectedBookingIds(new Set());
			router.refresh();
		} else {
			setErrorMsg(res.error || t('key_1783109439395_pxqf'));
		}
	};

	const handleMarkAsPaid = async (payoutId: string) => {
		setLoading(true);
		const res = await markPayoutAsPaid(payoutId);
		setLoading(false);

		if (res.success) {
			router.refresh();
		} else {
			alert(res.error || t('key_1783109439398_mcr8'));
		}
	};

	const handleMarkRefundAsPaid = async (refundId: string) => {
		setLoading(true);
		const res = await markParentRefundAsPaid(refundId);
		setLoading(false);

		if (res.success) {
			router.refresh();
		} else {
			alert(res.error || t('key_1783109439398_mcr8'));
		}
	};

	const handlePrint = (payout: PayoutRecord) => {
		setPayoutToPrint(payout);
		setTimeout(() => {
			window.print();
		}, 100);
	};

	const selectedTeacherGroup = groupedByTeacher.find(
		(g) => `${g.teacherId}:${g.currency}` === selectedGroupKey,
	);

	return (
		<div className="space-y-10 relative">
			{/* Print Only View */}
			{payoutToPrint && <PrintInvoice payoutToPrint={payoutToPrint} />}

			{/* Main UI */}
			<div className="print:hidden space-y-10">
				{/* Section 1: Pending Teachers */}
				<PendingTeachersList
					groupedByTeacher={groupedByTeacher}
					selectedGroupKey={selectedGroupKey}
					handleSelectGroup={handleSelectGroup}
				/>

				{/* Section 2: Selected Teacher Details & Drafting */}
				{selectedTeacherGroup && (
					<DraftPayoutSection
						selectedTeacherGroup={selectedTeacherGroup}
						selectedBookingIds={selectedBookingIds}
						setSelectedBookingIds={setSelectedBookingIds}
						handleToggleBooking={handleToggleBooking}
						draftResult={draftResult}
						handleIssuePayout={handleIssuePayout}
						loading={loading}
						errorMsg={errorMsg}
						successMsg={successMsg}
					/>
				)}

				{/* Section 3: Existing Payouts List */}
				<PayoutsHistoryList
					existingPayouts={existingPayouts}
					handlePrint={handlePrint}
					setSelectedPayoutId={setSelectedPayoutId}
					handleMarkAsPaid={handleMarkAsPaid}
					loading={loading}
				/>

				{/* Section 4: Parent Refunds List */}
				<ParentRefundsList
					parentRefunds={parentRefunds}
					handleMarkRefundAsPaid={handleMarkRefundAsPaid}
					loading={loading}
				/>
			</div>

			<DetailsModal
				isOpen={!!selectedPayoutId}
				onClose={() => setSelectedPayoutId(null)}
				entityType="payout"
				entityId={selectedPayoutId}
			/>
		</div>
	);
}
