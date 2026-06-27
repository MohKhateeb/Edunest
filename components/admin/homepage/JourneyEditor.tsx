"use client";

import { Plus, Trash2 } from "lucide-react";
import type { JourneyPathContent } from "@/types/homepage";

interface Props {
	content: JourneyPathContent;
	onChange: (content: JourneyPathContent) => void;
}

export default function JourneyEditor({ content, onChange }: Props) {
	const updateField = <K extends keyof JourneyPathContent>(
		field: K,
		value: JourneyPathContent[K],
	) => {
		onChange({ ...content, [field]: value });
	};

	const updateStep = (
		index: number,
		field: "title" | "description",
		value: string,
	) => {
		const newSteps = [...content.steps];
		newSteps[index] = { ...newSteps[index], [field]: value };
		updateField("steps", newSteps);
	};

	const addStep = () => {
		updateField("steps", [
			...content.steps,
			{ title: "خطوة جديدة", description: "وصف الخطوة هنا..." },
		]);
	};

	const removeStep = (index: number) => {
		updateField(
			"steps",
			content.steps.filter((_, i) => i !== index),
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
					<h4 className="text-xs font-bold text-foreground">قائمة الخطوات</h4>
					<button
						onClick={addStep}
						className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
					>
						<Plus className="w-3 h-3" /> إضافة خطوة
					</button>
				</div>
				<div className="space-y-3">
					{content.steps.map((step, idx) => (
						<div
							key={idx}
							className="flex flex-col gap-3 p-3 bg-muted/20 border border-border rounded-xl relative"
						>
							<div className="space-y-1">
								<label className="text-[10px] text-muted-foreground block font-bold">
									عنوان الخطوة
								</label>
								<input
									type="text"
									value={step.title}
									onChange={(e) => updateStep(idx, "title", e.target.value)}
									className="w-full premium-input text-xs font-bold"
								/>
							</div>
							<div className="space-y-1">
								<label className="text-[10px] text-muted-foreground block font-bold">
									التفاصيل
								</label>
								<textarea
									rows={2}
									value={step.description}
									onChange={(e) =>
										updateStep(idx, "description", e.target.value)
									}
									className="w-full premium-input text-xs leading-relaxed resize-none"
								/>
							</div>
							<button
								onClick={() => removeStep(idx)}
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
