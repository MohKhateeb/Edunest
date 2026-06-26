"use client";

import { Plus, Trash2 } from "lucide-react";
import { AVAILABLE_ICONS, type Section } from "@/types/homepage-layout";

interface FormProps {
	section: Section;
	updateProp: (id: string, prop: string, value: any) => void;
	updateItemInProp?: (
		id: string,
		prop: string,
		index: number,
		field: string,
		value: any,
	) => void;
	addItemInProp?: (id: string, prop: string, defaultItem: any) => void;
	deleteItemInProp?: (id: string, prop: string, index: number) => void;
}

export function HeroSectionForm({ section, updateProp }: FormProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					شارة البانر الترويجية (مثال: جديد)
				</label>
				<input
					type="text"
					value={section.props.badgeText || ""}
					onChange={(e) => updateProp(section.id, "badgeText", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					نص الشارة الترويجية
				</label>
				<input
					type="text"
					value={section.props.badgeMessage || ""}
					onChange={(e) =>
						updateProp(section.id, "badgeMessage", e.target.value)
					}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					العنوان العريض (Headline)
				</label>
				<input
					type="text"
					value={section.props.headline || ""}
					onChange={(e) => updateProp(section.id, "headline", e.target.value)}
					className="w-full premium-input text-xs font-bold"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					الوصف والتفاصيل (Subheadline)
				</label>
				<textarea
					rows={3}
					value={section.props.subheadline || ""}
					onChange={(e) =>
						updateProp(section.id, "subheadline", e.target.value)
					}
					className="w-full premium-input text-xs leading-relaxed resize-none"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					نص زر الدعوة الرئيسي
				</label>
				<input
					type="text"
					value={section.props.primaryBtnText || ""}
					onChange={(e) =>
						updateProp(section.id, "primaryBtnText", e.target.value)
					}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					رابط زر الدعوة الرئيسي
				</label>
				<input
					type="text"
					value={section.props.primaryBtnLink || ""}
					onChange={(e) =>
						updateProp(section.id, "primaryBtnLink", e.target.value)
					}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					نص الزر الثانوي
				</label>
				<input
					type="text"
					value={section.props.secondaryBtnText || ""}
					onChange={(e) =>
						updateProp(section.id, "secondaryBtnText", e.target.value)
					}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					رابط الزر الثانوي
				</label>
				<input
					type="text"
					value={section.props.secondaryBtnLink || ""}
					onChange={(e) =>
						updateProp(section.id, "secondaryBtnLink", e.target.value)
					}
					className="w-full premium-input text-xs"
				/>
			</div>
		</div>
	);
}

export function StatsSectionForm({
	section,
	updateItemInProp,
	addItemInProp,
	deleteItemInProp,
}: FormProps) {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h4 className="text-xs font-bold text-foreground">
					قائمة الإحصائيات والأرقام
				</h4>
				<button
					onClick={() =>
						addItemInProp?.(section.id, "items", {
							label: "إحصائية جديدة",
							value: 10,
							suffix: "+",
						})
					}
					className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
				>
					<Plus className="w-3 h-3" /> إضافة رقم إحصائي
				</button>
			</div>

			<div className="space-y-3">
				{(section.props.items || []).map((item: any, idx: number) => (
					<div
						key={idx}
						className="flex flex-col md:flex-row items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl"
					>
						<div className="flex-1 space-y-1 w-full">
							<label className="text-[10px] text-muted-foreground block font-bold">
								اسم الإحصائية
							</label>
							<input
								type="text"
								value={item.label || ""}
								onChange={(e) =>
									updateItemInProp?.(
										section.id,
										"items",
										idx,
										"label",
										e.target.value,
									)
								}
								className="w-full premium-input text-xs"
							/>
						</div>
						<div className="w-full md:w-32 space-y-1">
							<label className="text-[10px] text-muted-foreground block font-bold">
								الرقم المستهدف
							</label>
							<input
								type="number"
								value={item.value ?? 0}
								onChange={(e) =>
									updateItemInProp?.(
										section.id,
										"items",
										idx,
										"value",
										parseInt(e.target.value) || 0,
									)
								}
								className="w-full premium-input text-xs"
							/>
						</div>
						<div className="w-full md:w-20 space-y-1">
							<label className="text-[10px] text-muted-foreground block font-bold">
								اللاحقة (مثال: +)
							</label>
							<input
								type="text"
								value={item.suffix || ""}
								onChange={(e) =>
									updateItemInProp?.(
										section.id,
										"items",
										idx,
										"suffix",
										e.target.value,
									)
								}
								className="w-full premium-input text-xs text-center"
							/>
						</div>
						<button
							onClick={() => deleteItemInProp?.(section.id, "items", idx)}
							className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg self-end"
							title="حذف الإحصائية"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				))}
			</div>
		</div>
	);
}

export function SubjectsSectionForm({ section, updateProp }: FormProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					عنوان القسم
				</label>
				<input
					type="text"
					value={section.props.title || ""}
					onChange={(e) => updateProp(section.id, "title", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					المواد الدراسية (مفصولة بفاصلة)
				</label>
				<textarea
					rows={3}
					value={section.props.subjects?.join("، ") || ""}
					onChange={(e) => {
						const values = e.target.value
							.split(/[،,]\s*/)
							.filter((v: string) => v.trim() !== "");
						updateProp(section.id, "subjects", values);
					}}
					placeholder="رياضيات، فيزياء، كيمياء"
					className="w-full premium-input text-xs leading-relaxed resize-none"
				/>
			</div>
		</div>
	);
}

export function FeaturesSectionForm({
	section,
	updateProp,
	updateItemInProp,
	addItemInProp,
	deleteItemInProp,
}: FormProps) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						عنوان القسم
					</label>
					<input
						type="text"
						value={section.props.title || ""}
						onChange={(e) => updateProp(section.id, "title", e.target.value)}
						className="w-full premium-input text-xs"
					/>
				</div>
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						العنوان الفرعي للقسم
					</label>
					<input
						type="text"
						value={section.props.subtitle || ""}
						onChange={(e) => updateProp(section.id, "subtitle", e.target.value)}
						className="w-full premium-input text-xs"
					/>
				</div>
			</div>
			<div className="border-t border-border pt-4 space-y-4">
				<div className="flex justify-between items-center">
					<h4 className="text-xs font-bold text-foreground">
						قائمة المميزات والبطاقات
					</h4>
					<button
						onClick={() =>
							addItemInProp?.(section.id, "items", {
								iconName: "ShieldCheck",
								title: "ميزة جديدة",
								desc: "الوصف هنا.",
							})
						}
						className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
					>
						<Plus className="w-3 h-3" /> إضافة ميزة
					</button>
				</div>
				<div className="space-y-3">
					{(section.props.items || []).map((item: any, idx: number) => (
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
										value={item.iconName || "ShieldCheck"}
										onChange={(e) =>
											updateItemInProp?.(
												section.id,
												"items",
												idx,
												"iconName",
												e.target.value,
											)
										}
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
										value={item.title || ""}
										onChange={(e) =>
											updateItemInProp?.(
												section.id,
												"items",
												idx,
												"title",
												e.target.value,
											)
										}
										className="w-full premium-input text-xs font-bold"
									/>
								</div>
							</div>
							<div className="space-y-1">
								<label className="text-[10px] text-muted-foreground block font-bold">
									تفاصيل ووصف الميزة
								</label>
								<textarea
									rows={2}
									value={item.desc || ""}
									onChange={(e) =>
										updateItemInProp?.(
											section.id,
											"items",
											idx,
											"desc",
											e.target.value,
										)
									}
									className="w-full premium-input text-xs leading-relaxed resize-none"
								/>
							</div>
							<button
								onClick={() => deleteItemInProp?.(section.id, "items", idx)}
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

export function HowItWorksSectionForm({
	section,
	updateProp,
	updateItemInProp,
	addItemInProp,
	deleteItemInProp,
}: FormProps) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						عنوان القسم
					</label>
					<input
						type="text"
						value={section.props.title || ""}
						onChange={(e) => updateProp(section.id, "title", e.target.value)}
						className="w-full premium-input text-xs"
					/>
				</div>
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						العنوان الفرعي للقسم
					</label>
					<input
						type="text"
						value={section.props.subtitle || ""}
						onChange={(e) => updateProp(section.id, "subtitle", e.target.value)}
						className="w-full premium-input text-xs"
					/>
				</div>
			</div>
			<div className="border-t border-border pt-4 space-y-4">
				<div className="flex justify-between items-center">
					<h4 className="text-xs font-bold text-foreground">
						قائمة خطوات الاستخدام
					</h4>
					<button
						onClick={() =>
							addItemInProp?.(section.id, "items", {
								num: "١",
								title: "خطوة جديدة",
								desc: "الوصف هنا.",
							})
						}
						className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
					>
						<Plus className="w-3 h-3" /> إضافة خطوة
					</button>
				</div>
				<div className="space-y-3">
					{(section.props.items || []).map((item: any, idx: number) => (
						<div
							key={idx}
							className="flex flex-col md:flex-row items-start gap-3 p-3 bg-muted/20 border border-border rounded-xl relative"
						>
							<div className="w-full md:w-20 space-y-1">
								<label className="text-[10px] text-muted-foreground block font-bold">
									الرقم/الرمز
								</label>
								<input
									type="text"
									value={item.num || ""}
									onChange={(e) =>
										updateItemInProp?.(
											section.id,
											"items",
											idx,
											"num",
											e.target.value,
										)
									}
									className="w-full premium-input text-xs text-center"
								/>
							</div>
							<div className="flex-1 space-y-3 w-full">
								<div className="space-y-1">
									<label className="text-[10px] text-muted-foreground block font-bold">
										عنوان الخطوة
									</label>
									<input
										type="text"
										value={item.title || ""}
										onChange={(e) =>
											updateItemInProp?.(
												section.id,
												"items",
												idx,
												"title",
												e.target.value,
											)
										}
										className="w-full premium-input text-xs font-bold"
									/>
								</div>
								<div className="space-y-1">
									<label className="text-[10px] text-muted-foreground block font-bold">
										الوصف والتفاصيل
									</label>
									<textarea
										rows={2}
										value={item.desc || ""}
										onChange={(e) =>
											updateItemInProp?.(
												section.id,
												"items",
												idx,
												"desc",
												e.target.value,
											)
										}
										className="w-full premium-input text-xs leading-relaxed resize-none"
									/>
								</div>
							</div>
							<button
								onClick={() => deleteItemInProp?.(section.id, "items", idx)}
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

export function FeaturedTeachersSectionForm({
	section,
	updateProp,
}: FormProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					عنوان القسم
				</label>
				<input
					type="text"
					value={section.props.title || ""}
					onChange={(e) => updateProp(section.id, "title", e.target.value)}
					className="w-full premium-input text-xs font-bold"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					الحد الأقصى للعدد
				</label>
				<input
					type="number"
					value={section.props.limit ?? 6}
					onChange={(e) =>
						updateProp(section.id, "limit", parseInt(e.target.value) || 6)
					}
					className="w-full premium-input text-xs font-mono"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-3">
				<label className="text-[11px] font-bold text-muted-foreground block">
					الوصف (اختياري)
				</label>
				<input
					type="text"
					value={section.props.subtitle || ""}
					onChange={(e) => updateProp(section.id, "subtitle", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
		</div>
	);
}

export function TestimonialsSectionForm({
	section,
	updateProp,
	updateItemInProp,
	addItemInProp,
	deleteItemInProp,
}: FormProps) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						عنوان القسم
					</label>
					<input
						type="text"
						value={section.props.title || ""}
						onChange={(e) => updateProp(section.id, "title", e.target.value)}
						className="w-full premium-input text-xs font-bold"
					/>
				</div>
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						الوصف أو العنوان الفرعي
					</label>
					<input
						type="text"
						value={section.props.subtitle || ""}
						onChange={(e) => updateProp(section.id, "subtitle", e.target.value)}
						className="w-full premium-input text-xs"
					/>
				</div>
			</div>
			<div className="border-t border-border pt-4 space-y-4">
				<div className="flex justify-between items-center">
					<h4 className="text-xs font-bold text-foreground">
						قائمة الآراء والتقييمات
					</h4>
					<button
						onClick={() =>
							addItemInProp?.(section.id, "items", {
								text: "تجربة ممتازة جداً.",
								author: "مستخدم جديد",
								city: "المدينة",
							})
						}
						className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
					>
						<Plus className="w-3 h-3" /> إضافة رأي جديد
					</button>
				</div>
				<div className="space-y-3">
					{(section.props.items || []).map((item: any, idx: number) => (
						<div
							key={idx}
							className="flex flex-col gap-3 p-3 bg-muted/20 border border-border rounded-xl relative"
						>
							<div className="space-y-1 w-full">
								<label className="text-[10px] text-muted-foreground block font-bold">
									نص الرأي / التقييم
								</label>
								<textarea
									rows={2}
									value={item.text || ""}
									onChange={(e) =>
										updateItemInProp?.(
											section.id,
											"items",
											idx,
											"text",
											e.target.value,
										)
									}
									className="w-full premium-input text-xs leading-relaxed resize-none"
								/>
							</div>
							<div className="flex flex-col md:flex-row gap-3">
								<div className="flex-1 space-y-1">
									<label className="text-[10px] text-muted-foreground block font-bold">
										اسم كاتب الرأي
									</label>
									<input
										type="text"
										value={item.author || ""}
										onChange={(e) =>
											updateItemInProp?.(
												section.id,
												"items",
												idx,
												"author",
												e.target.value,
											)
										}
										className="w-full premium-input text-xs"
									/>
								</div>
								<div className="flex-1 space-y-1">
									<label className="text-[10px] text-muted-foreground block font-bold">
										المدينة أو الوصف
									</label>
									<input
										type="text"
										value={item.city || ""}
										onChange={(e) =>
											updateItemInProp?.(
												section.id,
												"items",
												idx,
												"city",
												e.target.value,
											)
										}
										className="w-full premium-input text-xs"
									/>
								</div>
							</div>
							<button
								onClick={() => deleteItemInProp?.(section.id, "items", idx)}
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

export function FaqSectionForm({ section, updateProp }: FormProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					عنوان القسم
				</label>
				<input
					type="text"
					value={section.props.title || ""}
					onChange={(e) => updateProp(section.id, "title", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					العنوان الفرعي للقسم
				</label>
				<input
					type="text"
					value={section.props.subtitle || ""}
					onChange={(e) => updateProp(section.id, "subtitle", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
		</div>
	);
}

export function CtaSectionForm({ section, updateProp }: FormProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					العنوان الرئيسي
				</label>
				<input
					type="text"
					value={section.props.title || ""}
					onChange={(e) => updateProp(section.id, "title", e.target.value)}
					className="w-full premium-input text-xs font-bold"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					الوصف والتفاصيل
				</label>
				<textarea
					rows={2}
					value={section.props.subtitle || ""}
					onChange={(e) => updateProp(section.id, "subtitle", e.target.value)}
					className="w-full premium-input text-xs leading-relaxed resize-none"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					نص زر الدعوة الرئيسي
				</label>
				<input
					type="text"
					value={section.props.primaryBtnText || ""}
					onChange={(e) =>
						updateProp(section.id, "primaryBtnText", e.target.value)
					}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					رابط زر الدعوة الرئيسي
				</label>
				<input
					type="text"
					value={section.props.primaryBtnLink || ""}
					onChange={(e) =>
						updateProp(section.id, "primaryBtnLink", e.target.value)
					}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					نص زر الدعوة الفرعي
				</label>
				<input
					type="text"
					value={section.props.secondaryBtnText || ""}
					onChange={(e) =>
						updateProp(section.id, "secondaryBtnText", e.target.value)
					}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					رابط زر الدعوة الفرعي
				</label>
				<input
					type="text"
					value={section.props.secondaryBtnLink || ""}
					onChange={(e) =>
						updateProp(section.id, "secondaryBtnLink", e.target.value)
					}
					className="w-full premium-input text-xs"
				/>
			</div>
		</div>
	);
}

export function CustomHtmlSectionForm({ section, updateProp }: FormProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					عنوان القسم المخصص (للأرشفة فقط)
				</label>
				<input
					type="text"
					value={section.props.title || ""}
					onChange={(e) => updateProp(section.id, "title", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					كود HTML مخصص (يدعم فئات Tailwind CSS)
				</label>
				<textarea
					rows={8}
					value={section.props.html || ""}
					onChange={(e) => updateProp(section.id, "html", e.target.value)}
					className="w-full premium-input text-xs font-mono leading-relaxed resize-y"
					placeholder="<div class='p-6'>...</div>"
				/>
				<span className="text-[10px] text-muted-foreground block">
					تنبيه: الرجاء التأكد من كتابة كود HTML مغلق وصحيح لتفادي تشويه الصفحة
					العامة للموقع.
				</span>
			</div>
		</div>
	);
}
