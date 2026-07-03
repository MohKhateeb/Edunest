"use client";

import type { UserType } from "@prisma/client";
import {
	AlertCircle,
	Briefcase,
	Check,
	Loader2,
	Lock,
	Mail,
	Phone,
	User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getActiveSubjects } from "@/lib/actions/subject";
import { registerUser } from "@/lib/actions/user";
import { cn } from "@/lib/utils";
import { registerSchema } from "@/lib/validations/user";

export default function RegisterPage() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		role: "PARENT" as "PARENT" | "TEACHER",
		name: "",
		email: "",
		phone: "",
		password: "",
		subjectIds: [] as string[],
	});
	const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	useEffect(() => {
		getActiveSubjects().then((res) => {
			if (res.success && res.data) {
				setSubjects(res.data);
			}
		});
	}, []);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleRoleChange = (role: "PARENT" | "TEACHER") => {
		setFormData((prev) => ({ ...prev, role }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrorMsg(null);

		try {
			// Validate inputs client-side
			const validated = registerSchema.safeParse({
				name: formData.name,
				email: formData.email,
				phone: formData.phone,
				password: formData.password,
				userType: formData.role,
			});

			if (!validated.success) {
				setErrorMsg(validated.error.issues[0].message);
				return;
			}

			const res = await registerUser({
				name: formData.name,
				email: formData.email,
				phone: formData.phone,
				password: formData.password,
				userType: formData.role,
				subjectIds:
					formData.role === "TEACHER" ? formData.subjectIds : undefined,
			});

			if (res.success) {
				setSuccess(true);
				setTimeout(() => {
					router.push("/login");
				}, 2000);
			} else {
				setErrorMsg(res.error);
			}
		} catch (err: unknown) {
			console.error(err);
			setErrorMsg("حدث خطأ غير متوقع أثناء التسجيل");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-teal-50 via-background to-teal-50/30 p-4">
			<div className="w-full max-w-md space-y-6">
				{/* Logo and header */}
				<div className="text-center space-y-2">
					<Link
						href="/"
						className="inline-flex items-center gap-2 tracking-tight"
					>
						<Image
							src="/logo.png"
							alt="EduNest"
							width={180}
							height={60}
							className="object-contain mix-blend-multiply"
							unoptimized
						/>
					</Link>
					<h2 className="text-2xl font-bold tracking-tight text-foreground/90">
						إنشاء حساب جديد
					</h2>
					<p className="text-xs text-muted-foreground">
						انضم إلى مجتمعنا التعليمي الموثوق اليوم
					</p>
				</div>

				{/* Card Form */}
				<div className="bg-card border border-border rounded-2xl p-8 glass shadow-lg glow-effect">
					{success ? (
						<div className="text-center py-6 space-y-3">
							<div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
								<Check className="h-6 w-6" />
							</div>
							<h3 className="text-lg font-bold text-foreground">
								تم إنشاء الحساب بنجاح!
							</h3>
							<p className="text-xs text-muted-foreground">
								جاري تحويلك إلى صفحة تسجيل الدخول...
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							{errorMsg && (
								<div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
									<AlertCircle className="h-4 w-4" />
									<span>{errorMsg}</span>
								</div>
							)}

							{/* Role Toggle tabs */}
							<div className="grid grid-cols-2 gap-1 bg-muted p-1.5 rounded-xl border border-border">
								<button
									type="button"
									onClick={() => handleRoleChange("PARENT")}
									className={cn(
										"text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer",
										formData.role === "PARENT"
											? "bg-card text-primary shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									ولي أمر طالب
								</button>
								<button
									type="button"
									onClick={() => handleRoleChange("TEACHER")}
									className={cn(
										"text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer",
										formData.role === "TEACHER"
											? "bg-card text-primary shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									معلم خصوصي
								</button>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
									<User className="h-3.5 w-3.5" />
									الاسم الكامل
								</label>
								<input
									type="text"
									name="name"
									required
									value={formData.name}
									onChange={handleChange}
									placeholder="محمد أحمد"
									className="w-full premium-input text-sm"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
									<Mail className="h-3.5 w-3.5" />
									البريد الإلكتروني
								</label>
								<input
									type="email"
									name="email"
									required
									value={formData.email}
									onChange={handleChange}
									placeholder="name@example.com"
									className="w-full premium-input text-sm"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
									<Phone className="h-3.5 w-3.5" />
									رقم الهاتف (اختياري)
								</label>
								<input
									type="tel"
									name="phone"
									value={formData.phone}
									onChange={handleChange}
									placeholder="0599000000"
									className="w-full premium-input text-sm"
								/>
							</div>

							{/* Subjects only for Tutor */}
							{formData.role === "TEACHER" && (
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
										<Briefcase className="h-3.5 w-3.5" />
										المواد التي تدرسها
									</label>
									<div className="flex flex-wrap gap-2 mt-2">
										{subjects.map((sub) => {
											const isSelected = formData.subjectIds.includes(sub.id);
											return (
												<button
													key={sub.id}
													type="button"
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															subjectIds: isSelected
																? prev.subjectIds.filter((id) => id !== sub.id)
																: [...prev.subjectIds, sub.id],
														}));
													}}
													className={cn(
														"px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
														isSelected
															? "bg-primary text-primary-foreground border-primary"
															: "bg-transparent text-muted-foreground border-input hover:border-primary/50",
													)}
												>
													{sub.name}
												</button>
											);
										})}
									</div>
								</div>
							)}

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
									<Lock className="h-3.5 w-3.5" />
									كلمة المرور
								</label>
								<input
									type="password"
									name="password"
									required
									value={formData.password}
									onChange={handleChange}
									placeholder="•••••••• (6 أحرف على الأقل)"
									className="w-full premium-input text-sm"
								/>
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
							>
								{loading ? (
									<>
										<Loader2 className="h-4.5 w-4.5 animate-spin" />
										جاري إنشاء الحساب...
									</>
								) : (
									"تسجيل حساب جديد"
								)}
							</button>
						</form>
					)}
				</div>

				{/* Footer info */}
				<p className="text-center text-xs text-muted-foreground">
					لديك حساب بالفعل؟{" "}
					<Link
						href="/login"
						className="font-semibold text-primary hover:underline"
					>
						سجل دخولك هنا
					</Link>
				</p>
			</div>
		</div>
	);
}
