"use client";

import {
	AlertCircle,
	Banknote,
	CheckCircle2,
	Clock,
	Edit3,
	Loader2,
	Percent,
	Power,
	PowerOff,
	RefreshCw,
	Save,
	Settings2,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	toggleServiceTypeStatus,
	updateServiceType,
} from "@/lib/actions/admin/service-types";
import { cn } from "@/lib/utils";

type ServiceType = {
	id: string;
	name: string;
	nameEnglish: string | null;
	defaultDuration: number;
	commissionRate: number; // passed as number (converted from Decimal)
	isRecurring: boolean;
	isActive: boolean;
	fazaaPrice: number | null; // passed as number
	fazaaDuration: number | null;
};

export default function AdminServiceTypesManager({
	initialServices,
}: {
	initialServices: ServiceType[];
}) {
	const router = useRouter();
	const [services, setServices] = useState<ServiceType[]>(initialServices);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState<Partial<ServiceType>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [isToggling, setIsToggling] = useState<string | null>(null);

	const startEditing = (service: ServiceType) => {
		setEditingId(service.id);
		setEditForm({ ...service });
	};

	const cancelEditing = () => {
		setEditingId(null);
		setEditForm({});
	};

	const handleToggle = async (id: string, currentStatus: boolean) => {
		setIsToggling(id);
		const res = await toggleServiceTypeStatus(id, currentStatus);
		setIsToggling(null);

		if (res.success) {
			toast.success(
				currentStatus ? "تم تعطيل الخدمة بنجاح" : "تم تفعيل الخدمة بنجاح",
			);
			setServices((prev) =>
				prev.map((s) => (s.id === id ? { ...s, isActive: !currentStatus } : s)),
			);
			router.refresh();
		} else {
			toast.error(res.error);
		}
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingId) return;

		setIsSaving(true);
		const res = await updateServiceType(editingId, {
			name: editForm.name || "",
			nameEnglish: editForm.nameEnglish || "",
			defaultDuration: Number(editForm.defaultDuration) || 0,
			commissionRate: Number(editForm.commissionRate) || 0,
			fazaaPrice: editForm.fazaaPrice ? Number(editForm.fazaaPrice) : null,
			fazaaDuration: editForm.fazaaDuration
				? Number(editForm.fazaaDuration)
				: null,
			isActive: editForm.isActive ?? true,
		});
		setIsSaving(false);

		if (res.success) {
			toast.success("تم تحديث الخدمة بنجاح 🎉");
			setServices((prev) =>
				prev.map((s) =>
					s.id === editingId ? ({ ...s, ...editForm } as ServiceType) : s,
				),
			);
			setEditingId(null);
			router.refresh();
		} else {
			toast.error(res.error);
		}
	};

	return (
		<div className="space-y-6" dir="rtl">
			<div>
				<h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-2">
					إدارة أنواع الخدمات والجلسات{" "}
					<Settings2 className="w-8 h-8 text-primary" />
				</h1>
				<p className="text-slate-500">
					تحكم بمدد الجلسات، العمولات، وأسعار خدمة "الفزعة" لكل نوع، بالإضافة
					لإمكانية تفعيل أو إخفاء الخدمات.
				</p>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
				{services.map((service) => {
					const isEditing = editingId === service.id;

					if (isEditing) {
						return (
							<form
								key={service.id}
								onSubmit={handleSave}
								className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-3xl p-6 shadow-lg relative overflow-hidden animate-in fade-in zoom-in-95"
							>
								<div className="absolute top-0 right-0 w-full h-1 bg-indigo-500" />
								<h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">
									تعديل: {service.name}
								</h3>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
									<div className="space-y-1">
										<label className="text-xs font-bold text-slate-600 dark:text-slate-400">
											الاسم (عربي)
										</label>
										<input
											type="text"
											required
											value={editForm.name || ""}
											onChange={(e) =>
												setEditForm({ ...editForm, name: e.target.value })
											}
											className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
										/>
									</div>
									<div className="space-y-1">
										<label className="text-xs font-bold text-slate-600 dark:text-slate-400">
											الاسم (انجليزي)
										</label>
										<input
											type="text"
											value={editForm.nameEnglish || ""}
											onChange={(e) =>
												setEditForm({
													...editForm,
													nameEnglish: e.target.value,
												})
											}
											className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
										/>
									</div>
									<div className="space-y-1">
										<label className="text-xs font-bold text-slate-600 dark:text-slate-400">
											المدة الافتراضية (دقائق)
										</label>
										<input
											type="number"
											required
											value={editForm.defaultDuration || ""}
											onChange={(e) =>
												setEditForm({
													...editForm,
													defaultDuration: Number(e.target.value),
												})
											}
											className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
										/>
									</div>
									<div className="space-y-1">
										<label className="text-xs font-bold text-slate-600 dark:text-slate-400">
											عمولة المنصة (%)
										</label>
										<input
											type="number"
											required
											step="any"
											value={editForm.commissionRate || ""}
											onChange={(e) =>
												setEditForm({
													...editForm,
													commissionRate: Number(e.target.value),
												})
											}
											className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
										/>
									</div>

									{/* إعدادات الفزعة */}
									{!service.isRecurring && (
										<>
											<div className="space-y-1 mt-4 md:col-span-2">
												<h4 className="text-sm font-bold text-amber-600 dark:text-amber-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
													⚡ إعدادات الفزعة (Live Radar)
												</h4>
											</div>
											<div className="space-y-1">
												<label htmlFor={`fazaaPrice-${service.id}`} className="text-xs font-bold text-slate-600 dark:text-slate-400">
													سعر الفزعة الموحد (شيكل)
												</label>
												<input
													id={`fazaaPrice-${service.id}`}
													type="number"
													value={editForm.fazaaPrice || ""}
													onChange={(e) =>
														setEditForm({
															...editForm,
															fazaaPrice: Number(e.target.value),
														})
													}
													placeholder="يترك فارغاً لتعطيل الفزعة لهذه الخدمة"
													className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-xs"
												/>
											</div>
											<div className="space-y-1">
												<label htmlFor={`fazaaDuration-${service.id}`} className="text-xs font-bold text-slate-600 dark:text-slate-400">
													مدة الفزعة (دقائق)
												</label>
												<input
													id={`fazaaDuration-${service.id}`}
													type="number"
													value={editForm.fazaaDuration || ""}
													onChange={(e) =>
														setEditForm({
															...editForm,
															fazaaDuration: Number(e.target.value),
														})
													}
													placeholder="مثال: 30"
													className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-xs"
												/>
											</div>
										</>
									)}
								</div>

								<div className="flex gap-3 justify-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
									<button
										type="button"
										onClick={cancelEditing}
										className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl transition-colors"
									>
										إلغاء
									</button>
									<button
										type="submit"
										disabled={isSaving}
										className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
									>
										{isSaving ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Save className="w-4 h-4" />
										)}
										حفظ التغييرات
									</button>
								</div>
							</form>
						);
					}

					// View Mode
					return (
						<div
							key={service.id}
							className={cn(
								"bg-white dark:bg-slate-900 border rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-md",
								service.isActive
									? "border-slate-200 dark:border-slate-800"
									: "border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10 opacity-75",
							)}
						>
							<div className="flex justify-between items-start mb-4">
								<div>
									<h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										{service.name}
										{!service.isActive && (
											<span className="text-xs font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded-md">
												معطلة
											</span>
										)}
										{service.isRecurring && (
											<RefreshCw className="w-4 h-4 text-purple-500" />
										)}
									</h3>
									<p className="text-sm text-slate-500">
										{service.nameEnglish || "No English Name"}
									</p>
								</div>

								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => startEditing(service)}
										className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
										title="تعديل"
									>
										<Edit3 className="w-5 h-5" />
									</button>
									<button
										type="button"
										onClick={() => handleToggle(service.id, service.isActive)}
										disabled={isToggling === service.id}
										className={cn(
											"p-2 rounded-xl transition-colors disabled:opacity-50",
											service.isActive
												? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
												: "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
										)}
										title={service.isActive ? "إيقاف الخدمة" : "تفعيل الخدمة"}
									>
										{isToggling === service.id ? (
											<Loader2 className="w-5 h-5 animate-spin" />
										) : service.isActive ? (
											<PowerOff className="w-5 h-5" />
										) : (
											<Power className="w-5 h-5" />
										)}
									</button>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 mt-6">
								<div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 dark:border-slate-800">
									<Clock className="w-5 h-5 text-slate-400" />
									<div>
										<div className="text-xs text-slate-500 dark:text-slate-400">
											المدة الافتراضية
										</div>
										<div className="font-bold text-slate-700 dark:text-slate-200">
											{service.defaultDuration} دقيقة
										</div>
									</div>
								</div>
								<div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 dark:border-slate-800">
									<Percent className="w-5 h-5 text-slate-400" />
									<div>
										<div className="text-xs text-slate-500 dark:text-slate-400">
											نسبة العمولة
										</div>
										<div className="font-bold text-slate-700 dark:text-slate-200">
											{service.commissionRate}%
										</div>
									</div>
								</div>

								{!service.isRecurring && (
									<div className="col-span-2 bg-amber-50 dark:bg-amber-950/10 rounded-2xl p-4 flex items-center justify-between border border-amber-100 dark:border-amber-900/30">
										<div className="flex items-center gap-3">
											<Zap className="w-5 h-5 text-amber-500" />
											<div>
												<div className="text-xs text-amber-700/70 dark:text-amber-500/70 font-bold">
													الفزعة (Live Radar)
												</div>
												<div className="font-bold text-amber-700 dark:text-amber-500">
													{service.fazaaPrice
														? `${service.fazaaPrice} شيكل`
														: "غير مفعل للخدمة"}
												</div>
											</div>
										</div>
										{service.fazaaDuration && (
											<div className="text-sm font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-lg">
												{service.fazaaDuration} دقيقة
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
