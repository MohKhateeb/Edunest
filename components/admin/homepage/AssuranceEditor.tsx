"use client";

import { Plus, Trash2 } from "lucide-react";
import type { AssuranceSectionContent } from "@/types/homepage";

// Available Lucide icons string array
const AVAILABLE_ICONS = ["ShieldCheck", "Video", "CreditCard", "MessageCircle", "Star", "Heart"];

interface Props {
	content: AssuranceSectionContent;
	onChange: (content: AssuranceSectionContent) => void;
}

export default function AssuranceEditor({ content, onChange }: Props) {
	const updateField = <K extends keyof AssuranceSectionContent>(field: K, value: AssuranceSectionContent[K]) => {
		onChange({ ...content, [field]: value });
	};

	const updateFeature = (index: number, field: "title" | "description" | "iconName", value: string) => {
		const newFeatures = [...content.features];
		newFeatures[index] = { ...newFeatures[index], [field]: value };
		updateField("features", newFeatures);
	};

	const addFeature = () => {
		updateField("features", [
			...content.features,
			{ iconName: "ShieldCheck", title: "ميزة جديدة", description: "الوصف هنا." },
		]);
	};

	const removeFeature = (index: number) => {
		updateField(
			"features",
			content.features.filter((_, i) => i !== index),
		);
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-1.5 md:col-span-2">
					<label className="text-[11px] font-bold text-muted-foreground block">
						عنوان القسم الرئيسي
					</label>
					<input
						type="text"
						value={content.title}
						onChange={(e) => updateField("title", e.target.value)}
						className="w-full premium-input text-xs font-bold"
					/>
				</div>
				<div className="space-y-1.5 md:col-span-2">
					<label className="text-[11px] font-bold text-muted-foreground block">
						الوصف / العنوان الفرعي
					</label>
					<input
						type="text"
						value={content.subtitle}
						onChange={(e) => updateField("subtitle", e.target.value)}
						className="w-full premium-input text-xs"
					/>
				</div>
			</div>

			<div className="border-t border-border pt-4 space-y-4">
				<div className="flex justify-between items-center">
					<h4 className="text-xs font-bold text-foreground">قائمة المميزات (الضمانات)</h4>
					<button
						onClick={addFeature}
						className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
					>
						<Plus className="w-3 h-3" /> إضافة ميزة
					</button>
				</div>
				<div className="space-y-3">
					{content.features.map((feature, idx) => (
						<div
							key={idx}
							className="flex flex-col gap-3 p-3 bg-muted/20 border border-border rounded-xl relative"
						>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div className="space-y-1">
									<label className="text-[10px] text-muted-foreground block font-bold">
										الأيقونة (Lucide)
									</label>
									<select
										value={feature.iconName}
										onChange={(e) => updateFeature(idx, "iconName", e.target.value)}
										className="w-full premium-input text-xs"
									>
										{AVAILABLE_ICONS.map((ic) => (
											<option key={ic} value={ic}>
												{ic}
											</option>
										))}
									</select>
								</div>
								<div className="md:col-span-2 space-y-1">
									<label className="text-[10px] text-muted-foreground block font-bold">
										عنوان الميزة
									</label>
									<input
										type="text"
										value={feature.title}
										onChange={(e) => updateFeature(idx, "title", e.target.value)}
										className="w-full premium-input text-xs font-bold"
									/>
								</div>
							</div>
							<div className="space-y-1">
								<label className="text-[10px] text-muted-foreground block font-bold">
									تفاصيل الميزة
								</label>
								<textarea
									rows={2}
									value={feature.description}
									onChange={(e) => updateFeature(idx, "description", e.target.value)}
									className="w-full premium-input text-xs leading-relaxed resize-none"
								/>
							</div>
							<button
								onClick={() => removeFeature(idx)}
								className="absolute top-2 left-2 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
