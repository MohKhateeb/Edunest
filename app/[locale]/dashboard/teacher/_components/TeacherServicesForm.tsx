"use client";
import { useTranslations } from "next-intl";

import {
	AlertCircle,
	Briefcase,
	Check,
	Clock,
	DollarSign,
	Loader2,
	Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addOrUpdateTeacherService } from "@/lib/actions/teacher";
import { isKnownValidationKey } from "@/lib/constants/validation-keys";
import { teacherServiceSchema } from "@/lib/validations/teacher";
import { Currency } from "@prisma/client";
import { getAllCurrencies, getCurrencySymbol } from "@/lib/utils/currency";

type ServiceType = {
	id: string;
	name: string;
	defaultDuration: number;
};

type ConfiguredService = {
	id: string;
	price: number;
	duration: number;
	customDescription: string | null;
	serviceType: {
		name: string;
	};
	currency: Currency;
};

type TeacherServicesFormProps = {
	serviceTypes: ServiceType[];
	configuredServices: ConfiguredService[];
	defaultCurrency: Currency;
};

export default function TeacherServicesForm({
	serviceTypes,
	configuredServices,
	defaultCurrency,
}: TeacherServicesFormProps) {
    const t = useTranslations('teachers')
	const tValidation = useTranslations('validation');
	const router = useRouter();
	const [formData, setFormData] = useState({
		selectedServiceTypeId: "",
		price: "50",
		duration: "60",
		customDescription: "",
		currency: defaultCurrency,
	});
	const [loading, setLoading] = useState(false);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	// Sync service changes to auto-fill default values
	const handleServiceTypeChange = (id: string) => {
		const selected = serviceTypes.find((st) => st.id === id);
		setFormData((prev) => ({
			...prev,
			selectedServiceTypeId: id,
			duration: selected ? String(selected.defaultDuration) : prev.duration,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrorMsg(null);
		setSuccessMsg(null);

		const data = {
			serviceTypeId: formData.selectedServiceTypeId,
			price: Number(formData.price),
			duration: Number(formData.duration),
			customDescription: formData.customDescription || undefined,
			currency: formData.currency,
		};

		try {
			const validated = teacherServiceSchema.safeParse(data);
			if (!validated.success) {
				const rawMessage = validated.error.issues[0].message;
				setErrorMsg(tValidation(
					isKnownValidationKey(rawMessage) ? rawMessage : "validation_generic_error"
				));
				return;
			}

			const res = await addOrUpdateTeacherService(data);
			if (res.success) {
				setSuccessMsg(t('services_success_save'));
				setFormData({
					selectedServiceTypeId: "",
					price: "50",
					duration: "60",
					customDescription: "",
					currency: defaultCurrency,
				});
				router.refresh();
			} else {
				setErrorMsg(res.error);
			}
		} catch (err: unknown) {
			console.error(err);
			setErrorMsg(t('services_error_save'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-8 space-y-8 shadow-sm hover:shadow-md transition-all">
			<div>
				<h2 className="font-extrabold text-xl mb-1">{t('services_title')}</h2>
				<p className="text-xs text-muted-foreground">
					{t('services_description')}
				</p>
			</div>

			{/* Grid: Configured List vs Addition Form */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
				{/* Addition form */}
				<form
					onSubmit={handleSubmit}
					className="lg:col-span-1 bg-slate-50 dark:bg-slate-800/50 border border-border/50 rounded-3xl p-6 space-y-4 shadow-inner"
				>
					<h3 className="font-bold text-sm border-b border-border pb-2.5 flex items-center gap-1.5 text-primary">
						<Plus className="h-4.5 w-4.5" />
						{t('services_add_update_title')}</h3>

					{errorMsg && (
						<div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
							<AlertCircle className="h-4 w-4" />
							<span>{errorMsg}</span>
						</div>
					)}

					{successMsg && (
						<div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
							<span>{successMsg}</span>
						</div>
					)}

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground block">
							{t('services_type_label')}</label>
						<select
							value={formData.selectedServiceTypeId}
							onChange={(e) => handleServiceTypeChange(e.target.value)}
							className="w-full premium-input text-xs"
							required
						>
							<option value="">{t('services_type_placeholder')}</option>
							{serviceTypes.map((st) => (
								<option key={st.id} value={st.id}>
									{st.name}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground block">
							{t('services_fee_label')}</label>
						<input
							type="number"
							name="price"
							required
							min={5}
							value={formData.price}
							onChange={handleChange}
							className="w-full premium-input text-xs"
						/>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground block">
							{t('services_currency_label')}</label>
						<select
							name="currency"
							value={formData.currency}
							onChange={handleChange}
							className="w-full premium-input text-xs"
							required
						>
							{getAllCurrencies().map((c) => (
								<option key={c.code} value={c.code}>
									{c.nameAr} ({c.symbol})
								</option>
							))}
						</select>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground block">
							{t('services_duration_label')}</label>
						<input
							type="number"
							name="duration"
							required
							min={5}
							value={formData.duration}
							onChange={handleChange}
							className="w-full premium-input text-xs"
						/>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground block">
							{t('services_details_label')}</label>
						<textarea
							name="customDescription"
							rows={2}
							value={formData.customDescription}
							onChange={handleChange}
							placeholder={t('services_details_placeholder')}
							className="w-full text-xs premium-input resize-none"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								{t('services_btn_saving')}</>
						) : (
							<>
								<Check className="h-4 w-4" />
								{t('services_btn_save')}</>
						)}
					</button>
				</form>

				{/* Configured List */}
				<div className="lg:col-span-2 space-y-4">
					<h3 className="font-bold text-sm flex items-center gap-1.5">
						<Briefcase className="h-4.5 w-4.5 text-muted-foreground" />
						{t('services_active_title')}{configuredServices.length})
					</h3>

					{configuredServices.length === 0 ? (
						<div className="border border-border/50 border-dashed rounded-3xl p-10 text-center text-sm font-semibold text-muted-foreground bg-slate-50 dark:bg-slate-800/50">
							{t('services_no_services')}
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{configuredServices.map((cs) => (
								<div
									key={cs.id}
									className="border border-border/60 rounded-3xl p-5 hover:shadow-md bg-white dark:bg-slate-900 relative space-y-3 transition-all"
								>
									<div className="font-bold text-sm text-foreground/80">
										{cs.serviceType.name}
									</div>

									<div className="flex gap-4 text-xs text-muted-foreground">
										<span className="flex items-center gap-1">
											<Clock className="h-3.5 w-3.5" />
											{cs.duration} {t('services_duration_unit')}</span>
										<span className="flex items-center gap-1 text-primary font-semibold">
											<DollarSign className="h-3.5 w-3.5" />
											{cs.price} {getCurrencySymbol(cs.currency)}</span>
									</div>

									{cs.customDescription && (
										<p className="text-[11px] text-muted-foreground bg-accent/40 px-2 py-1 rounded-md">
											{cs.customDescription}
										</p>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
