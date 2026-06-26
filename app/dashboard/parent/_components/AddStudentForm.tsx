"use client";

import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { addStudent } from "@/lib/actions/user";
import { studentSchema } from "@/lib/validations/user";

export default function AddStudentForm() {
	const [formData, setFormData] = useState({
		name: "",
		grade: "1",
		school: "",
	});
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrorMsg(null);

		const data = {
			name: formData.name,
			grade: Number(formData.grade),
			school: formData.school || undefined,
		};

		try {
			// Client side check
			const validated = studentSchema.safeParse(data);
			if (!validated.success) {
				setErrorMsg(validated.error.issues[0].message);
				return;
			}

			const res = await addStudent(data);
			if (res.success) {
				setFormData({
					name: "",
					school: "",
					grade: "1",
				});
			} else {
				setErrorMsg(res.error);
			}
		} catch (err: unknown) {
			console.error(err);
			setErrorMsg("حدث خطأ غير متوقع أثناء إضافة الطالب");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-premium"
		>
			<h3 className="font-black text-base border-b border-border/60 pb-2.5 flex items-center gap-2">
				إضافة طالب جديد للحساب
			</h3>

			{errorMsg && (
				<div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-xl border border-destructive/20">
					<AlertCircle className="h-4 w-4" />
					<span>{errorMsg}</span>
				</div>
			)}

			<div className="space-y-1">
				<label className="text-xs font-bold text-muted-foreground block">
					اسم الطالب *
				</label>
				<input
					type="text"
					name="name"
					required
					value={formData.name}
					onChange={handleChange}
					placeholder="محمد أحمد"
					className="w-full premium-input text-xs"
				/>
			</div>

			<div className="space-y-1">
				<label className="text-xs font-bold text-muted-foreground block">
					الصف الدراسي *
				</label>
				<select
					name="grade"
					value={formData.grade}
					onChange={handleChange}
					className="w-full premium-input text-xs"
				>
					{Array.from({ length: 12 }).map((_, index) => {
						const classNum = index + 1;
						return (
							<option key={classNum} value={classNum}>
								الصف {classNum}
							</option>
						);
					})}
				</select>
			</div>

			<div className="space-y-1">
				<label className="text-xs font-bold text-muted-foreground block">
					المدرسة (اختياري)
				</label>
				<input
					type="text"
					name="school"
					value={formData.school}
					onChange={handleChange}
					placeholder="مدرسة بيت لحم الثانوية"
					className="w-full premium-input text-xs"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:shadow-lg hover:-translate-y-0.5"
			>
				{loading ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						جاري الإضافة...
					</>
				) : (
					<>
						<Plus className="h-4 w-4" />
						إضافة الطالب
					</>
				)}
			</button>
		</form>
	);
}
