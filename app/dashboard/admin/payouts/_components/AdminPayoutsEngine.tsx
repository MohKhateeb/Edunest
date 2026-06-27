"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import DetailsModal from "@/components/shared/DetailsModal";
import {
	createTeacherPayout,
	markParentRefundAsPaid,
	markPayoutAsPaid,
} from "@/lib/actions/payout";
import type { ParentRefundRecord, PayoutRecord } from "@/types/payout";
import type { AdminPayoutsData } from "@/lib/services/domain/financial-service";
import { DraftPayoutSection } from "./payouts/DraftPayoutSection";
import { ParentRefundsList } from "./payouts/ParentRefundsList";
import { PendingTeachersList } from "./payouts/PendingTeachersList";
import { PayoutsHistoryList } from "./payouts/PayoutsHistoryList";
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
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

	const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
		null,
	);
	const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(
		new Set(),
	);

	const [payoutToPrint, setPayoutToPrint] = useState<PayoutRecord | null>(null);

	const groupedByTeacher = teacherGroups;

	const handleSelectTeacher = (teacherId: string) => {
		setSelectedTeacherId(teacherId);
		setErrorMsg(null);
		setSuccessMsg(null);
		const teacherGroup = groupedByTeacher.find(
			(g) => g.teacherId === teacherId,
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
		if (!selectedTeacherId) return null;
		const teacher = groupedByTeacher.find(
			(g) => g.teacherId === selectedTeacherId,
		);
		if (!teacher) return null;

		let totalAmount = 0;
		let commissionAmount = 0;
		let trialCompensation = 0;
		let count = 0;

		for (const b of teacher.bookings) {
			if (selectedBookingIds.has(b.id)) {
				count++;
				totalAmount += b.totalAmount;
				commissionAmount += b.commissionAmount;
				trialCompensation += b.trialCompensation;
			}
		}

		return {
			bookingCount: count,
			totalAmount,
			commissionAmount,
			trialCompensation,
			netAmount: totalAmount - commissionAmount + trialCompensation,
		};
	}, [selectedTeacherId, groupedByTeacher, selectedBookingIds]);

	const handleIssuePayout = async () => {
		if (!selectedTeacherId || !draftResult || draftResult.bookingCount === 0)
			return;

		setLoading(true);
		setErrorMsg(null);
		setSuccessMsg(null);

		const res = await createTeacherPayout({
			teacherId: selectedTeacherId,
			bookingIds: Array.from(selectedBookingIds),
		});

		setLoading(false);

		if (res.success) {
			setSuccessMsg("تم إصدار وثيقة التسوية المالية للمعلم بنجاح ✓");
			setSelectedTeacherId(null);
			setSelectedBookingIds(new Set());
			router.refresh();
		} else {
			setErrorMsg(res.error || "حدث خطأ أثناء إصدار التسوية");
		}
	};

	const handleMarkAsPaid = async (payoutId: string) => {
		setLoading(true);
		const res = await markPayoutAsPaid(payoutId);
		setLoading(false);

		if (res.success) {
			router.refresh();
		} else {
			alert(res.error || "حدث خطأ غير معروف");
		}
	};

	const handleMarkRefundAsPaid = async (refundId: string) => {
		setLoading(true);
		const res = await markParentRefundAsPaid(refundId);
		setLoading(false);

		if (res.success) {
			router.refresh();
		} else {
			alert(res.error || "حدث خطأ غير معروف");
		}
	};

	const handlePrint = (payout: PayoutRecord) => {
		setPayoutToPrint(payout);
		setTimeout(() => {
			window.print();
		}, 100);
	};

	const selectedTeacherGroup = groupedByTeacher.find(
		(g) => g.teacherId === selectedTeacherId,
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
					selectedTeacherId={selectedTeacherId}
					handleSelectTeacher={handleSelectTeacher}
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
