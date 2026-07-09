"use client";
import { useTranslations } from "next-intl";

import {
	AlertCircle,
	CheckCircle2,
	Link as LinkIcon,
	Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { updateTeacherSlug } from "@/lib/actions/teacher";
import { teacherSlugSchema } from "@/lib/validations/teacher";

interface TeacherSlugFormProps {
	currentSlug: string;
	slugUpdated: boolean;
}

export default function TeacherSlugForm({
	currentSlug,
	slugUpdated,
}: TeacherSlugFormProps) {
    const t = useTranslations('teachers')
	const tValidation = useTranslations('validation');
	const [slug, setSlug] = useState(currentSlug);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (slugUpdated) return;

		setError(null);
		setSuccess(null);
		setLoading(true);

		try {
			const validated = teacherSlugSchema.safeParse({ slug });
			if (!validated.success) {
				setError(tValidation(validated.error.issues[0].message as any));
				setLoading(false);
				return;
			}

			if (slug === currentSlug) {
				setError(t('slug_identical_text'));
				setLoading(false);
				return;
			}

			const res = await updateTeacherSlug({ slug });
			if (res.success) {
				toast.success(t('slug_success_text'), {
					description: t('slug_success_desc', { slug }),
				});
				setSuccess(t('slug_success_title')); // just to freeze the UI
			} else {
				toast.error(t('profile_error_title'), {
					description: res.error || t('slug_error_unexpected'),
				});
			}
		} catch (err) {
			toast.error(t('slug_error_connection_title'), {
				description: t('slug_error_connection_desc'),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
			<div className="p-6 border-b border-border bg-muted/20">
				<h2 className="text-xl font-extrabold flex items-center gap-2">
					<LinkIcon className="h-5 w-5 text-primary" />
					{t('slug_title')}</h2>
				<p className="text-sm text-muted-foreground mt-2">
					{t('slug_description')}
					{!slugUpdated && (
						<strong className="text-amber-600 block mt-1">
							{t('slug_warning_text')}</strong>
					)}
				</p>
			</div>

			<div className="p-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<label className="text-sm font-bold block">{t('key_1783109437488_y0zv')}</label>
						<div className="flex flex-col sm:flex-row gap-3">
							<div
								className="relative flex-1 flex items-center rtl:flex-row-reverse text-end"
								dir="ltr"
							>
								<span className="bg-muted px-4 py-3 rounded-e-xl border border-s-0 border-border text-muted-foreground text-sm">
									edunest.com/teachers/
								</span>
								<input
									type="text"
									value={slug}
									onChange={(e) => setSlug(e.target.value.toLowerCase())}
									disabled={slugUpdated || loading || !!success}
									className="premium-input rounded-e-none flex-1 text-sm text-end"
									dir="ltr"
									placeholder="john-doe"
								/>
							</div>

							{!slugUpdated && !success && (
								<button
									type="submit"
									disabled={loading || slug === currentSlug}
									className="premium-btn w-full sm:w-auto flex justify-center"
								>
									{loading ? (
										<Loader2 className="h-5 w-5 animate-spin" />
									) : (
										t('slug_btn_save')
									)}
								</button>
							)}
						</div>

						{slugUpdated || success ? (
							<p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-2">
								<CheckCircle2 className="h-4 w-4" />
								{t('key_1783109437494_edxl')}</p>
						) : (
							<p className="text-xs text-muted-foreground">
								{t('key_1783109437501_i20y')}</p>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
