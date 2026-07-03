"use client";

import { FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import Portal from "@/components/shared/Portal";
import { submitSessionReport } from "@/lib/actions/booking";
import { useTranslations } from "next-intl";

interface ReportModalProps {
	bookingId: string | null;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function ReportModal({
	bookingId,
	onClose,
	onSuccess,
}: ReportModalProps) {
    const t = useTranslations('common');
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [reportForm, setReportForm] = useState({
		studentAttended: true,
		topicsCovered: "",
		studentPerformance: "5",
		homeworkAssigned: "",
		teacherNotes: "",
	});

	if (!bookingId) return null;

	const handleReportSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (reportForm.studentAttended && !reportForm.topicsCovered.trim()) {
			toast.warning(t('byanat_naqsh'), {
				description: t('alrjaa_tabeh_almwadya_almghtah'),
			});
			return;
		}
		setLoading(true);
		const res = await submitSessionReport({
			bookingId,
			studentAttended: reportForm.studentAttended,
			topicsCovered: reportForm.topicsCovered,
			studentPerformance: reportForm.studentAttended
				? Number(reportForm.studentPerformance)
				: null,
			homeworkAssigned: reportForm.homeworkAssigned,
			teacherNotes: reportForm.teacherNotes,
		});
		setLoading(false);

		if (res.success) {
			toast.success(t('tm_irsal_altqryr'), {
				description: t('tm_hfdh_tqryr_aljlsh'),
			});
			onClose();
			onSuccess?.();
			router.refresh(); // Refresh the data to show the report is submitted
		} else {
			toast.error(t('fshl_irsal_altqryr'), { description: res.error });
		}
	};

	return (
		<Portal>
			<div
				className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 overflow-y-auto animate-in fade-in duration-200"
				dir="rtl"
			>
				<div
					className="w-full max-w-lg relative bg-card border border-border rounded-2xl shadow-2xl p-1 animate-in zoom-in-95 duration-200 my-8"
					onClick={(e) => e.stopPropagation()}
				>
					<button
						onClick={onClose}
						className="absolute top-4 end-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border bg-card shadow-xs"
						aria-label={t('ighlaq_alnafthh')}
					>
						<X className="h-5 w-5" />
					</button>

					<form
						onSubmit={handleReportSubmit}
						className="bg-card rounded-xl p-6 space-y-5"
					>
						<h4 className="font-extrabold text-lg text-primary flex items-center gap-2 border-b border-primary/10 pb-3 pt-2">
							<FileText className="h-5.5 w-5.5" />
							{t('tabeh_waatmad_tqryr_aljlsh')}</h4>

						<div className="space-y-4">
							<div className="flex items-center gap-2 bg-accent/30 p-3.5 rounded-xl border border-border/50">
								<input
									type="checkbox"
									id="attended"
									checked={reportForm.studentAttended}
									onChange={(e) =>
										setReportForm({
											...reportForm,
											studentAttended: e.target.checked,
										})
									}
									className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
								/>
								<label
									htmlFor="attended"
									className="font-bold cursor-pointer text-foreground text-sm"
								>
									{t('hl_hdr_altalb_aljlsh')}</label>
							</div>

							{reportForm.studentAttended ? (
								<>
									<div className="space-y-1.5">
										<label className="block text-xs font-bold text-muted-foreground">
											{t('adaa_altalb_wtqyymh_15')}</label>
										<select
											value={reportForm.studentPerformance}
											onChange={(e) =>
												setReportForm({
													...reportForm,
													studentPerformance: e.target.value,
												})
											}
											className="w-full premium-input text-sm bg-background/50 border-border"
										>
											<option value="5">{t('mmtaz_jda_5')}</option>
											<option value="4">{t('jyd_jda_4')}</option>
											<option value="3">{t('mtwst_aladaa_3')}</option>
											<option value="2">{t('yhtaj_thsyn_2')}</option>
											<option value="1">{t('dayf_jda_1')}</option>
										</select>
									</div>

									<div className="space-y-1.5">
										<label className="block text-xs font-bold text-muted-foreground">
											{t('almwadya_alty_tm_tghtytha_1')}</label>
										<textarea
											required
											rows={3}
											value={reportForm.topicsCovered}
											onChange={(e) =>
												setReportForm({
													...reportForm,
													topicsCovered: e.target.value,
												})
											}
											placeholder={t('aktb_hna_almwadya_walmsael')}
											className="w-full premium-input text-sm resize-none bg-background/50 border-border"
										/>
									</div>

									<div className="space-y-1.5">
										<label className="block text-xs font-bold text-muted-foreground">
											{t('alwajbat_almnzlyh_almqrrh_akhtyary')}</label>
										<textarea
											rows={2}
											value={reportForm.homeworkAssigned}
											onChange={(e) =>
												setReportForm({
													...reportForm,
													homeworkAssigned: e.target.value,
												})
											}
											placeholder={t('ay_tdrybat_aw_wajbat')}
											className="w-full premium-input text-sm resize-none bg-background/50 border-border"
										/>
									</div>
								</>
							) : (
								<div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
									<p className="text-xs font-bold text-amber-800 dark:text-amber-400">
										{t('bma_an_altalb_lm')}</p>
								</div>
							)}

							<div className="space-y-1.5">
								<label className="block text-xs font-bold text-muted-foreground">
									{reportForm.studentAttended
										? t('mlahdhat_almalm_lwly_alamr')
										: t('mlahdhat_hwl_alghyab_akhtyary')}
								</label>
								<textarea
									rows={2}
									value={reportForm.teacherNotes}
									onChange={(e) =>
										setReportForm({
											...reportForm,
											teacherNotes: e.target.value,
										})
									}
									placeholder={
										reportForm.studentAttended
											? t('mlahdhat_aw_twsyat_idafyh')
											: t('sbb_alghyab_itha_knt')
									}
									className="w-full premium-input text-sm resize-none bg-background/50 border-border"
								/>
							</div>
						</div>

						<div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border">
							<button
								type="button"
								onClick={onClose}
								className="text-xs font-bold border border-border bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground px-5 py-2.5 rounded-xl transition-colors"
							>
								{t('traja_wilghaa')}</button>
							<button
								type="submit"
								disabled={loading}
								className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-2"
							>
								{loading ? (
									<span className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
								) : (
									<FileText className="h-4 w-4" />
								)}
								{t('aatmad_altqryr_winhaa_alhsh')}</button>
						</div>
					</form>
				</div>
			</div>
		</Portal>
	);
}
