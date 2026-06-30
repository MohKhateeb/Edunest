"use client";

import {
	AlertCircle,
	BookOpen,
	CheckCircle,
	Loader2,
	User,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BookingSuccessState } from "@/components/bookings/BookingSuccessState";
import { NoStudentsState } from "@/components/bookings/NoStudentsState";
import { QuickQuestionFields } from "@/components/bookings/QuickQuestionFields";
import { TrialToggle } from "@/components/bookings/TrialToggle";
import { PaymentModal } from "@/components/shared/PaymentModal";
import { useBookingSubmission } from "@/hooks/useBookingSubmission";
import { createBooking } from "@/lib/actions/booking";
import { SERVICES } from "@/lib/translations";
import TimeSlotPicker from "./TimeSlotPicker";

type Student = {
	id: string;
	name: string;
	grade: number;
};

type ServiceType = {
	id: string;
	name: string;
	nameEnglish: string | null;
	defaultDuration: number;
};

type TeacherService = {
	id: string;
	price: number;
	duration: number;
	serviceType: ServiceType;
};

type Teacher = {
	id: string;
	userId: string;
	slug: string;
	profileImageUrl: string | null;
	user: {
		name: string;
	};
	services: TeacherService[];
	availability: {
		dayOfWeek: number;
		startTime: string;
		endTime: string;
	}[];
	bookings: {
		startTime: Date;
		duration: number;
	}[];
};

type NewBookingFormProps = {
	students: Student[];
	teachers: Teacher[];
	hasUsedTrial: boolean;
};

export default function NewBookingForm({
	students,
	teachers,
	hasUsedTrial,
}: NewBookingFormProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const teacherParam = searchParams.get("teacher");
	const serviceParam = searchParams.get("service");
	const initialTutor = teacherParam
		? teachers.find((teacher) => teacher.slug === teacherParam)
		: undefined;
	const initialService = serviceParam
		? initialTutor?.services.find((service) => service.id === serviceParam)
		: undefined;

	// Selected tutor parameters
	const [formData, setFormData] = useState({
		selectedTutorId: initialTutor?.id ?? "",
		selectedServiceId: initialService?.id ?? "",
		selectedStudentId: students[0]?.id ?? "",
		isTrial: false,
		startTime: null as Date | null,
		parentNotes: "",
		questionTitle: "",
		questionDetails: "",
		questionImageUrl: "",
	});

	const {
		createdBooking,
		loading,
		errorMsg,
		setErrorMsg,
		success,
		submitBooking,
		closePaymentModal,
	} = useBookingSubmission();

	const activeTutor = teachers.find((t) => t.id === formData.selectedTutorId);
	const activeService = activeTutor?.services.find(
		(s) => s.id === formData.selectedServiceId,
	);

	const handleCustomChange = (
		name: string,
		value: string | boolean | number | Date | null,
	) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleCheckboxChange = (name: string, checked: boolean) => {
		setFormData((prev) => ({ ...prev, [name]: checked }));
	};

	const handleBookingSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.selectedStudentId) {
			setErrorMsg("يرجى تحديد الطالب");
			return;
		}
		if (!formData.selectedTutorId) {
			setErrorMsg("يرجى تحديد المعلم");
			return;
		}
		if (!formData.selectedServiceId) {
			setErrorMsg("يرجى تحديد نوع الخدمة المطلوب حجزها");
			return;
		}
		if (!formData.startTime) {
			setErrorMsg("يرجى تحديد تاريخ ووقت الجلسة المطلوب");
			return;
		}

		await submitBooking({
			studentId: formData.selectedStudentId,
			teacherServiceId: formData.selectedServiceId,
			startTime: formData.startTime,
			isTrial: formData.isTrial,
			questionTitle:
				activeService?.serviceType.name === SERVICES.QUICK_HELP
					? formData.questionTitle
					: undefined,
			questionDetails:
				activeService?.serviceType.name === SERVICES.QUICK_HELP
					? formData.questionDetails
					: undefined,
			questionImageUrl:
				activeService?.serviceType.name === SERVICES.QUICK_HELP
					? formData.questionImageUrl
					: undefined,
			parentNotes: formData.parentNotes || undefined,
			price: activeService?.price || 0,
		});
	};

	if (students.length === 0) {
		return <NoStudentsState />;
	}

	return (
		<div className="max-w-2xl mx-auto">
			<div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
				{success ? (
					<BookingSuccessState />
				) : (
					<form onSubmit={handleBookingSubmit} className="space-y-6">
						<h2 className="font-extrabold text-xl border-b border-border pb-3 flex items-center gap-2">
							جدولة حجز جلسة جديدة
						</h2>

						{errorMsg && (
							<div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
								<AlertCircle className="h-4 w-4" />
								<span>{errorMsg}</span>
							</div>
						)}

						<div className="space-y-1.5">
							<label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
								<User className="h-4 w-4" />
								الطالب المستهدف
							</label>
							<select
								value={formData.selectedStudentId}
								onChange={(e) =>
									handleCustomChange("selectedStudentId", e.target.value)
								}
								className="w-full premium-input text-xs"
							>
								{students.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name} (الصف {s.grade})
									</option>
								))}
							</select>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
								<User className="h-4 w-4" />
								اختيار المعلم الخصوصي
							</label>
							<select
								value={formData.selectedTutorId}
								onChange={(e) => {
									setFormData((prev) => ({
										...prev,
										selectedTutorId: e.target.value,
										selectedServiceId: "",
										startTime: null,
									}));
								}}
								className="w-full premium-input text-xs"
							>
								<option value="">-- اختر معلماً من القائمة --</option>
								{teachers.map((t) => (
									<option key={t.id} value={t.id}>
										{t.user.name}
									</option>
								))}
							</select>
						</div>

						{formData.selectedTutorId && activeTutor && (
							<div className="flex items-center gap-3 p-4 bg-accent/40 rounded-xl border border-border animate-fadeIn">
								<div className="relative h-12 w-12 rounded-xl overflow-hidden bg-accent border border-border flex-shrink-0">
									{activeTutor.profileImageUrl ? (
										<img
											src={activeTutor.profileImageUrl}
											alt={activeTutor.user.name}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="h-full w-full flex items-center justify-center text-primary font-bold text-lg bg-primary/10">
											{activeTutor.user.name.charAt(0)}
										</div>
									)}
								</div>
								<div>
									<h4 className="font-bold text-sm text-foreground">
										{activeTutor.user.name}
									</h4>
									<p className="text-xs text-muted-foreground">
										معلم معتمد وموثق على المنصة
									</p>
								</div>
							</div>
						)}

						{formData.selectedTutorId && activeTutor && (
							<div className="space-y-1.5 animate-fadeIn">
								<label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
									<BookOpen className="h-4 w-4" />
									نوع الخدمة المطلوبة
								</label>
								<select
									value={formData.selectedServiceId}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											selectedServiceId: e.target.value,
											startTime: null,
										}));
									}}
									className="w-full premium-input text-xs"
								>
									<option value="">-- اختر الخدمة المطلوبة --</option>
									{activeTutor.services.map((s) => (
										<option key={s.id} value={s.id}>
											{s.serviceType.name} (السعر: {s.price} شيكل / {s.duration}{" "}
											دقيقة)
										</option>
									))}
								</select>
							</div>
						)}

						{formData.selectedServiceId && !hasUsedTrial && (
							<TrialToggle
								isTrial={formData.isTrial}
								onChange={(c) => handleCheckboxChange("isTrial", c)}
							/>
						)}

						{activeService?.serviceType.name === SERVICES.QUICK_HELP && (
							<QuickQuestionFields
								title={formData.questionTitle}
								details={formData.questionDetails}
								onChange={(name, value) => handleCustomChange(name, value)}
							/>
						)}

						{formData.selectedServiceId && activeTutor && (
							<div className="border-t border-border pt-4">
								<TimeSlotPicker
									availability={activeTutor.availability}
									existingBookings={activeTutor.bookings}
									duration={
										formData.isTrial ? 30 : activeService?.duration || 60
									}
									onChange={(date) => handleCustomChange("startTime", date)}
								/>
							</div>
						)}

						{/* Notes */}
						{formData.startTime && (
							<div className="space-y-1.5">
								<label className="text-xs font-bold text-muted-foreground">
									ملاحظات إضافية للمعلم (اختياري)
								</label>
								<textarea
									name="parentNotes"
									rows={2}
									value={formData.parentNotes}
									onChange={handleChange}
									placeholder="أي ملاحظات أو تفاصيل تريد مشاركتها مع المعلم..."
									className="w-full text-xs premium-input resize-none"
								/>
							</div>
						)}

						{/* Confirm Book */}
						{formData.startTime && (
							<div className="pt-4 border-t border-border flex justify-end">
								<button
									type="submit"
									disabled={loading}
									className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
								>
									{loading ? (
										<>
											<Loader2 className="h-4.5 w-4.5 animate-spin" />
											جاري معالجة وحفظ الحجز...
										</>
									) : (
										"تأكيد طلب حجز الجلسة"
									)}
								</button>
							</div>
						)}
					</form>
				)}
			</div>
		</div>
	);
}
