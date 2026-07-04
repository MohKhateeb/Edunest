import { useTranslations } from "next-intl";

"use client";

import {
	AlertCircle,
	BadgeCheck,
	Banknote,
	Briefcase,
	CheckCircle2,
	Clock,
	HandCoins,
	Info,
	Loader2,
	Percent,
	Save,
	Settings2,
	ShieldAlert,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateSystemSettings } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

type SystemSetting = {
	id: string;
	settingKey: string;
	settingValue: string;
	description: string | null;
};

type AdminSettingsFormProps = {
	initialSettings: SystemSetting[];
	groupedSettings: Record<string, SystemSetting[]>;
};

// --------------------------------------------------------
// Settings Dictionary for UI/UX
// --------------------------------------------------------
type SettingConfig = {
	label: string;
	type: "number" | "boolean" | "currency" | "percentage" | "text";
	icon: React.ElementType;
	category: "FINANCIAL" | "POLICY" | "TRIAL" | "OTHER";
};





export default function AdminSettingsForm({
	initialSettings,
	groupedSettings: initialGroupedSettings,
}: AdminSettingsFormProps) {
    const t = useTranslations('admin')

	const SETTINGS_DICT: Record<string, SettingConfig> = {
		DefaultCommissionRate: {
			label: t('key_1783109431253_ro7j') ,
			type: "percentage",
			icon: Percent,
			category: "FINANCIAL",
		},
		QuickHelpCommissionRate: {
			label: t('key_1783109431258_w77p') ,
			type: "percentage",
			icon: Zap,
			category: "FINANCIAL",
		},
		MonthlyPackageCommissionRate: {
			label: t('key_1783109431263_k1m2') ,
			type: "percentage",
			icon: Briefcase,
			category: "FINANCIAL",
		},
		MinBookingPrice: {
			label: t('key_1783109431268_hwq9') ,
			type: "currency",
			icon: Banknote,
			category: "FINANCIAL",
		},
		FreeTrialEnabled: {
			label: t('key_1783109431273_wqz0') ,
			type: "boolean",
			icon: BadgeCheck,
			category: "TRIAL",
		},
		FreeTrialDurationMinutes: {
			label: t('key_1783109431277_s8cp') ,
			type: "number",
			icon: Clock,
			category: "TRIAL",
		},
		FreeTrialCostToPlatform: {
			label: t('key_1783109431282_dgh8') ,
			type: "currency",
			icon: HandCoins,
			category: "TRIAL",
		},
		MaxRefundRequests: {
			label: t('key_1783109431287_ukuz') ,
			type: "number",
			icon: ShieldAlert,
			category: "POLICY",
		},
		CancellationRefundHours: {
			label: t('key_1783109431309_hggs') ,
			type: "number",
			icon: Clock,
			category: "POLICY",
		},
		MinBookingLeadHours: {
			label: t('key_1783109431322_2aej') ,
			type: "number",
			icon: Clock,
			category: "POLICY",
		},
		PAYMENT_HOLD_MINUTES: {
			label: t('key_1783109431341_csxp') ,
			type: "number",
			icon: Clock,
			category: "POLICY",
		},
	};

	const CATEGORIES = {
		FINANCIAL: {
			label: t('key_1783109431355_p6te') ,
			icon: Banknote,
			color: "text-emerald-600 dark:text-emerald-400",
			bg: "bg-emerald-50 dark:bg-emerald-950/20",
		},
		TRIAL: {
			label: t('key_1783109431375_b6lw') ,
			icon: BadgeCheck,
			color: "text-indigo-600 dark:text-indigo-400",
			bg: "bg-indigo-50 dark:bg-indigo-950/20",
		},
		POLICY: {
			label: t('key_1783109431493_em8j') ,
			icon: ShieldAlert,
			color: "text-rose-600 dark:text-rose-400",
			bg: "bg-rose-50 dark:bg-rose-950/20",
		},
		OTHER: {
			label: t('key_1783109431500_d2px') ,
			icon: Settings2,
			color: "text-slate-600 dark:text-slate-400",
			bg: "bg-slate-50 dark:bg-slate-800",
		},
	};
	const router = useRouter();
	const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
	const [loading, setLoading] = useState(false);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleValueChange = (key: string, value: string) => {
		setSuccessMsg(null);
		setErrorMsg(null);
		setSettings((prev) =>
			prev.map((s) =>
				s.settingKey === key ? { ...s, settingValue: value } : s,
			),
		);
	};

	const handleToggleChange = (key: string, checked: boolean) => {
		handleValueChange(key, checked ? "true" : "false");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrorMsg(null);
		setSuccessMsg(null);

		const payload = settings.map((s) => ({
			settingKey: s.settingKey,
			settingValue: s.settingValue,
		}));

		const res = await updateSystemSettings(payload);
		setLoading(false);

		if (res.success) {
			setSuccessMsg(t('key_1783109431506_i0an'));
			router.refresh();
			window.scrollTo({ top: 0, behavior: "smooth" });
		} else {
			setErrorMsg(res.error);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	// The grouped Settings are provided by the Backend DTO
	// However, we still need to reflect the local edits from `settings` state to the grouped UI
	const getLatestSettingValue = (key: string) => {
		return settings.find((s) => s.settingKey === key)?.settingValue || "";
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-2">
					{t('key_1783109431174_p68f')}{" "}
					<Settings2 className="w-8 h-8 text-primary" />
				</h1>
				<p className="text-slate-500">
					تحكم بالعمولات، سياسات الإلغاء، الجلسات المجانية والقواعد الأساسية
					للمنصة بكل سهولة.
				</p>
			</div>

			{errorMsg && (
				<div className="flex items-center gap-3 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm animate-in fade-in slide-in-from-top-4">
					<AlertCircle className="h-5 w-5 flex-shrink-0" />
					<span className="font-semibold">{errorMsg}</span>
				</div>
			)}

			{successMsg && (
				<div className="flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-4">
					<CheckCircle2 className="h-5 w-5 flex-shrink-0" />
					<span className="font-semibold">{successMsg}</span>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-8">
				{(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(
					(catKey) => {
						const catItems = initialGroupedSettings[catKey];
						if (!catItems || catItems.length === 0) return null;

						const categoryDef = CATEGORIES[catKey];
						const CategoryIcon = categoryDef.icon;

						return (
							<div
								key={catKey}
								className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
							>
								{/* Category Header */}
								<div
									className={cn(
										"px-6 py-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800",
										categoryDef.bg,
									)}
								>
									<div
										className={cn(
											"p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm",
											categoryDef.color,
										)}
									>
										<CategoryIcon className="w-5 h-5" />
									</div>
									<h2 className={cn("text-lg font-bold", categoryDef.color)}>
										{categoryDef.label}
									</h2>
								</div>

								{/* Category Settings Grid */}
								<div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{catItems.map((setting) => {
										const config = SETTINGS_DICT[setting.settingKey] || {
											label: setting.settingKey,
											type: "text",
											icon: Settings2,
											category: "OTHER",
										};
										const Icon = config.icon;
										const isToggle = config.type === "boolean";
										const currentValue = getLatestSettingValue(
											setting.settingKey,
										);

										return (
											<div
												key={setting.id}
												className="space-y-3 relative group"
											>
												<div className="flex justify-between items-start mb-1">
													<label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
														<Icon className="w-4 h-4 text-slate-400" />
														{config.label}
													</label>
												</div>

												{isToggle ? (
													<div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
														<label className="relative inline-flex items-center cursor-pointer">
															<input
																type="checkbox"
																className="sr-only peer"
																checked={currentValue === "true"}
																onChange={(
																	e: React.ChangeEvent<HTMLInputElement>,
																) =>
																	handleToggleChange(
																		setting.settingKey,
																		e.target.checked,
																	)
																}
															/>
															<div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:-translate-x-[0.1rem] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:end-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600 rtl:peer-checked:after:-translate-x-full"></div>
														</label>
														<span
															className={cn(
																"text-sm font-bold",
																currentValue === "true"
																	? "text-emerald-600"
																	: "text-slate-400",
															)}
														>
															{currentValue === "true" ? t('key_1783109431512_y8p5') : t('key_1783109431517_tx1v')}
														</span>
													</div>
												) : (
													<div className="relative">
														<input
															type={
																config.type === "number" ||
																config.type === "percentage" ||
																config.type === "currency"
																	? "number"
																	: "text"
															}
															required
															step="any"
															value={currentValue}
															onChange={(e) =>
																handleValueChange(
																	setting.settingKey,
																	e.target.value,
																)
															}
															className={cn(
																"w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
																config.type === "percentage" && "pe-10 ps-4",
																config.type === "currency" && "pe-14 ps-4",
															)}
														/>
														{config.type === "percentage" && (
															<div className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
																%
															</div>
														)}
														{config.type === "currency" && (
															<div className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
																{t('key_1783109431203_nwey')}</div>
														)}
													</div>
												)}

												{(setting.description ||
													config.category === "OTHER") && (
													<p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 leading-relaxed">
														<Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
														{setting.description ||
															`Key: ${setting.settingKey}`}
													</p>
												)}
											</div>
										);
									})}
								</div>
							</div>
						);
					},
				)}

				{/* Floating Action Bar */}
				<div className="sticky bottom-6 z-20 flex justify-end">
					<div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
						<p className="text-xs font-medium text-slate-500 px-4 hidden sm:block">
							{t('key_1783109431215_pqoi')}</p>
						<button
							type="submit"
							disabled={loading}
							className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold px-8 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-primary/25 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
						>
							{loading ? (
								<>
									<Loader2 className="h-5 w-5 animate-spin" />
									{t('key_1783109431228_mser')}</>
							) : (
								<>
									<Save className="h-5 w-5" />
									{t('key_1783109431241_4oxt')}</>
							)}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
