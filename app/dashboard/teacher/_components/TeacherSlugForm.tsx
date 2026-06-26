"use client";

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
				setError(validated.error.issues[0].message);
				setLoading(false);
				return;
			}

			if (slug === currentSlug) {
				setError("الرابط مطابق للرابط الحالي.");
				setLoading(false);
				return;
			}

			const res = await updateTeacherSlug({ slug });
			if (res.success) {
				toast.success("تم تحديث الرابط بنجاح!", {
					description: `الرابط الجديد الخاص بك هو: ${slug}`,
				});
				setSuccess("تم التحديث بنجاح"); // just to freeze the UI
			} else {
				toast.error("حدث خطأ", {
					description: res.error || "حدث خطأ غير متوقع",
				});
			}
		} catch (err) {
			toast.error("خطأ في الاتصال", {
				description: "حدث خطأ أثناء الاتصال بالخادم",
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
					رابط الملف الشخصي (Slug)
				</h2>
				<p className="text-sm text-muted-foreground mt-2">
					هذا هو الرابط الذي سيظهر للطلاب وأولياء الأمور للوصول إلى ملفك الشخصي.
					{!slugUpdated && (
						<strong className="text-amber-600 block mt-1">
							تنبيه: يمكنك تعديل هذا الرابط لمرة واحدة فقط.
						</strong>
					)}
				</p>
			</div>

			<div className="p-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<label className="text-sm font-bold block">الرابط المخصص</label>
						<div className="flex flex-col sm:flex-row gap-3">
							<div
								className="relative flex-1 flex items-center rtl:flex-row-reverse text-left"
								dir="ltr"
							>
								<span className="bg-muted px-4 py-3 rounded-l-xl border border-r-0 border-border text-muted-foreground text-sm">
									edunest.com/teachers/
								</span>
								<input
									type="text"
									value={slug}
									onChange={(e) => setSlug(e.target.value.toLowerCase())}
									disabled={slugUpdated || loading || !!success}
									className="premium-input rounded-l-none flex-1 text-sm text-left"
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
										"حفظ الرابط"
									)}
								</button>
							)}
						</div>

						{slugUpdated || success ? (
							<p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-2">
								<CheckCircle2 className="h-4 w-4" />
								تم تحديد الرابط ولا يمكن تعديله.
							</p>
						) : (
							<p className="text-xs text-muted-foreground">
								يسمح باستخدام الأحرف الإنجليزية، الأرقام، والشرطات (-) فقط.
							</p>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
