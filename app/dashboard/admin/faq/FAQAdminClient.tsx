"use client";

import type { FAQ, FAQCategory } from "@prisma/client";
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createFAQ, deleteFAQ, updateFAQ } from "@/lib/actions/faq";

const CATEGORY_LABELS = {
	PARENT: "ولي الأمر",
	TEACHER: "المعلم",
	ADMIN: "الإدارة",
};

export default function FAQAdminClient({
	initialFaqs,
}: {
	initialFaqs: FAQ[];
}) {
	const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
	const [activeTab, setActiveTab] = useState<FAQCategory>("PARENT");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Form State
	const [formData, setFormData] = useState<{
		question: string;
		answer: string;
		category: FAQCategory;
		isActive: boolean;
		order: number;
	}>({
		question: "",
		answer: "",
		category: "PARENT",
		isActive: true,
		order: 0,
	});

	const filteredFaqs = faqs
		.filter((f) => f.category === activeTab)
		.sort((a, b) => a.order - b.order);

	const handleOpenModal = (faq?: FAQ) => {
		if (faq) {
			setEditingFaq(faq);
			setFormData({
				question: faq.question,
				answer: faq.answer,
				category: faq.category,
				isActive: faq.isActive,
				order: faq.order,
			});
		} else {
			setEditingFaq(null);
			setFormData({
				question: "",
				answer: "",
				category: activeTab,
				isActive: true,
				order: filteredFaqs.length + 1,
			});
		}
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingFaq(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			if (editingFaq) {
				const res = await updateFAQ(editingFaq.id, formData);
				if (res.success) {
					if (res.data) {
						setFaqs((prev) =>
							prev.map((f) => (f.id === editingFaq.id ? res.data! : f)),
						);
					}
					toast.success("تم التحديث بنجاح");
					handleCloseModal();
				} else {
					toast.error(res.error || "خطأ أثناء التحديث");
				}
			} else {
				const res = await createFAQ(formData);
				if (res.success) {
					if (res.data) {
						setFaqs((prev) => [...prev, res.data!]);
					}
					toast.success("تمت الإضافة بنجاح");
					handleCloseModal();
				} else {
					toast.error(res.error || "خطأ أثناء الإضافة");
				}
			}
		} catch (err: unknown) {
			console.error(err);
			toast.error("حدث خطأ غير متوقع");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;

		try {
			const res = await deleteFAQ(id);
			if (res.success) {
				setFaqs((prev) => prev.filter((f) => f.id !== id));
				toast.success("تم الحذف بنجاح");
			} else {
				toast.error(res.error || "خطأ أثناء الحذف");
			}
		} catch (err: unknown) {
			console.error(err);
			toast.error("حدث خطأ غير متوقع");
		}
	};

	return (
		<div className="space-y-6">
			{/* Tabs */}
			<div className="border-b border-gray-200">
				<nav
					className="-mb-px flex space-x-8 space-x-reverse"
					aria-label="Tabs"
				>
					{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
						<button
							key={key}
							onClick={() => setActiveTab(key as FAQCategory)}
							className={`${
								activeTab === key
									? "border-primary text-primary"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
						>
							أسئلة {label}
						</button>
					))}
				</nav>
			</div>

			<div className="flex justify-end">
				<button
					onClick={() => handleOpenModal()}
					className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
				>
					<Plus className="w-4 h-4" />
					<span>إضافة سؤال جديد</span>
				</button>
			</div>

			{/* Table */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200 text-sm">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">
								الترتيب
							</th>
							<th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider w-1/3">
								السؤال
							</th>
							<th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider w-1/3">
								الإجابة
							</th>
							<th className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">
								الحالة
							</th>
							<th className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">
								إجراءات
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filteredFaqs.length > 0 ? (
							filteredFaqs.map((faq) => (
								<tr key={faq.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-6 py-4 whitespace-nowrap text-gray-900">
										{faq.order}
									</td>
									<td className="px-6 py-4 text-gray-900">
										<div className="line-clamp-2">{faq.question}</div>
									</td>
									<td className="px-6 py-4 text-gray-500">
										<div className="line-clamp-2">{faq.answer}</div>
									</td>
									<td className="px-6 py-4 text-center">
										<span
											className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												faq.isActive
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{faq.isActive ? "فعال" : "مخفي"}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-center">
										<div className="flex items-center justify-center gap-3">
											<button
												onClick={() => handleOpenModal(faq)}
												className="text-blue-600 hover:text-blue-900 transition-colors"
												title="تعديل"
											>
												<Edit2 className="w-5 h-5" />
											</button>
											<button
												onClick={() => handleDelete(faq.id)}
												className="text-red-600 hover:text-red-900 transition-colors"
												title="حذف"
											>
												<Trash2 className="w-5 h-5" />
											</button>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
									لا توجد أسئلة شائعة في هذا القسم حتى الآن.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
					<div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
						<div className="flex justify-between items-center p-6 border-b border-gray-100">
							<h2 className="text-xl font-bold text-gray-900">
								{editingFaq ? "تعديل السؤال" : "إضافة سؤال جديد"}
							</h2>
							<button
								onClick={handleCloseModal}
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								<X className="w-6 h-6" />
							</button>
						</div>

						<form
							onSubmit={handleSubmit}
							className="p-6 overflow-y-auto space-y-6"
						>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									السؤال
								</label>
								<input
									type="text"
									required
									value={formData.question}
									onChange={(e) =>
										setFormData({ ...formData, question: e.target.value })
									}
									className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
									placeholder="أدخل السؤال هنا..."
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									الإجابة
								</label>
								<textarea
									required
									rows={4}
									value={formData.answer}
									onChange={(e) =>
										setFormData({ ...formData, answer: e.target.value })
									}
									className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
									placeholder="أدخل الإجابة هنا..."
								/>
							</div>

							<div className="grid grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										القسم
									</label>
									<select
										value={formData.category}
										onChange={(e) =>
											setFormData({
												...formData,
												category: e.target.value as FAQCategory,
											})
										}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
									>
										{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
											<option key={key} value={key}>
												{label}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										الترتيب (الأقل يظهر أولاً)
									</label>
									<input
										type="number"
										min="1"
										required
										value={formData.order}
										onChange={(e) =>
											setFormData({
												...formData,
												order: parseInt(e.target.value) || 0,
											})
										}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
									/>
								</div>
							</div>

							<div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
								<label className="relative flex cursor-pointer items-center rounded-full p-3">
									<input
										type="checkbox"
										className="peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-primary checked:bg-primary focus:outline-none"
										checked={formData.isActive}
										onChange={(e) =>
											setFormData({ ...formData, isActive: e.target.checked })
										}
									/>
									<div className="pointer-events-none absolute top-2/4 start-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
										<Check className="h-3.5 w-3.5" />
									</div>
								</label>
								<div>
									<p className="text-sm font-medium text-gray-900">
										حالة السؤال
									</p>
									<p className="text-xs text-gray-500">
										هل ترغب في عرض هذا السؤال للمستخدمين؟
									</p>
								</div>
							</div>

							<div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
								<button
									type="button"
									onClick={handleCloseModal}
									className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
								>
									إلغاء
								</button>
								<button
									type="submit"
									disabled={isLoading}
									className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? "جاري الحفظ..." : "حفظ السؤال"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
