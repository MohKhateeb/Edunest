"use client";

import {
	AlertCircle,
	BookCheck,
	CheckCircle,
	Search,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PaymentModal } from "@/components/shared/PaymentModal";
import { createBooking, searchAvailableTeachers } from "@/lib/actions/booking";
import { SERVICES } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { getLocalDateString, PALESTINE_TZ } from "@/lib/utils/time";
import type { AvailableTeacher, Student } from "@/types/booking";
import { BookingDetailsStep } from "./booking-journey/BookingDetailsStep";
import { TeacherSelectionStep } from "./booking-journey/TeacherSelectionStep";
import { TimeSearchStep } from "./booking-journey/TimeSearchStep";

type TimeFirstBookingFormProps = {
	students: Student[];
	subjects: { id: string; name: string }[];
	hasUsedTrial: boolean;
};

export default function TimeFirstBookingForm({
	students,
	subjects,
	hasUsedTrial,
}: TimeFirstBookingFormProps) {
	const router = useRouter();

	// خطوات النموذج
	type Step = "search" | "results" | "details";
	const [currentStep, setCurrentStep] = useState<Step>("search");

	// خطوة البحث
	const [searchQuery, setSearchQuery] = useState({
		selectedSpec: "",
		selectedDate: "",
		selectedTime: "",
	});
	const [searching, setSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);

	// نتائج البحث
	const [availableTeachers, setAvailableTeachers] = useState<
		AvailableTeacher[]
	>([]);

	// خطوة التفاصيل
	const [bookingDetails, setBookingDetails] = useState({
		selectedTeacher: null as AvailableTeacher | null,
		selectedServiceId: "",
		selectedStudentId: students[0]?.id ?? "",
		isTrial: false,
		parentNotes: "",
		questionTitle: "",
		questionDetails: "",
		questionImageUrl: "",
	});

	// حالة الإرسال
	const [createdBooking, setCreatedBooking] = useState<{
		id: string;
		price: number;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// الحد الأدنى للتاريخ
	const minDateString = useMemo(() => getLocalDateString(new Date()), []);

	// توقيتات الساعات المتاحة
	const timeOptions = useMemo(() => {
		const options = [];
		for (let h = 7; h < 23; h++) {
			for (let m = 0; m < 60; m += 30) {
				const hStr = String(h).padStart(2, "0");
				const mStr = String(m).padStart(2, "0");
				const time = `${hStr}:${mStr}`;
				// تحويل لعرض بصيغة 12 ساعة
				const dateForDisplay = new Date(`2024-01-01T${time}:00`);
				const label = dateForDisplay.toLocaleTimeString("ar-EG", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: true,
				});
				options.push({ value: time, label });
			}
		}
		return options;
	}, []);

	const activeService = bookingDetails.selectedTeacher?.services.find(
		(s) => s.id === bookingDetails.selectedServiceId,
	);

	const handleSearchChange = (name: string, value: string) => {
		setSearchQuery((prev) => ({ ...prev, [name]: value }));
	};

	const handleBookingChange = (name: string, value: string | boolean | number | null) => {
		setBookingDetails((prev) => ({ ...prev, [name]: value }));
	};

	// البحث عن معلمين متاحين
	const handleSearch = async () => {
		if (!searchQuery.selectedSpec) {
			setSearchError("يرجى اختيار المادة");
			return;
		}
		if (!searchQuery.selectedDate) {
			setSearchError("يرجى اختيار التاريخ");
			return;
		}
		if (!searchQuery.selectedTime) {
			setSearchError("يرجى اختيار الوقت");
			return;
		}

		setSearching(true);
		setSearchError(null);

		try {
			const result = await searchAvailableTeachers({
				subjectId: searchQuery.selectedSpec,
				date: searchQuery.selectedDate,
				timeSlot: searchQuery.selectedTime,
			});

			if (result.success && result.data) {
				setAvailableTeachers(result.data.teachers);
				setCurrentStep("results");
			} else if (!result.success) {
				setSearchError(result.error);
			}
		} catch (err: unknown) {
			console.error(err);
			setSearchError("حدث خطأ أثناء البحث");
		} finally {
			setSearching(false);
		}
	};

	// اختيار معلم والانتقال للتفاصيل
	const handleSelectTeacher = (teacher: AvailableTeacher) => {
		setBookingDetails((prev) => ({
			...prev,
			selectedTeacher: teacher,
			selectedServiceId: teacher.services[0]?.id ?? "",
		}));
		setCurrentStep("details");
	};

	// إرسال الحجز النهائي
	const handleBookingSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!bookingDetails.selectedStudentId) {
			setErrorMsg("يرجى تحديد الطالب");
			return;
		}
		if (!bookingDetails.selectedServiceId || !bookingDetails.selectedTeacher) {
			setErrorMsg("يرجى تحديد الخدمة المطلوبة");
			return;
		}

		setLoading(true);
		setErrorMsg(null);

		// بناء startTime من التاريخ والوقت المحددين
		const startTime = new Date(
			`${searchQuery.selectedDate}T${searchQuery.selectedTime}:00`,
		);

		try {
			const res = await createBooking({
				studentId: bookingDetails.selectedStudentId,
				teacherServiceId: bookingDetails.selectedServiceId,
				startTime,
				isTrial: bookingDetails.isTrial,
				questionTitle:
					activeService?.serviceTypeName === SERVICES.QUICK_HELP
						? bookingDetails.questionTitle
						: undefined,
				questionDetails:
					activeService?.serviceTypeName === SERVICES.QUICK_HELP
						? bookingDetails.questionDetails
						: undefined,
				questionImageUrl:
					activeService?.serviceTypeName === SERVICES.QUICK_HELP
						? bookingDetails.questionImageUrl
						: undefined,
				parentNotes: bookingDetails.parentNotes || undefined,
				paymentMethod: "ONLINE_CARD",
			});

			if (res.success) {
				if (bookingDetails.isTrial) {
					setSuccess(true);
					setTimeout(() => {
						router.push("/dashboard/parent/bookings");
					}, 2000);
				} else if (res.data) {
					setCreatedBooking({
						id: res.data.bookingId,
						price: activeService?.price || 0,
					});
				}
			} else {
				setErrorMsg(res.error);
				setLoading(false);
			}
		} catch (err: unknown) {
			console.error(err);
			setErrorMsg("حدث خطأ غير متوقع أثناء إتمام الحجز");
			setLoading(false);
		}
	};

	// عرض اسم الوقت المختار
	const selectedTimeLabel = useMemo(() => {
		if (!searchQuery.selectedTime) return "";
		return (
			timeOptions.find((o) => o.value === searchQuery.selectedTime)?.label ??
			searchQuery.selectedTime
		);
	}, [searchQuery.selectedTime, timeOptions]);

	// تحويل التاريخ لعرض عربي
	const selectedDateLabel = useMemo(() => {
		if (!searchQuery.selectedDate) return "";
		const d = new Date(searchQuery.selectedDate);
		const dayName = new Intl.DateTimeFormat("ar-PS", {
			timeZone: PALESTINE_TZ,
			weekday: "long",
		}).format(d);
		const dayNum = new Intl.DateTimeFormat("ar-PS", {
			timeZone: PALESTINE_TZ,
			day: "numeric",
		}).format(d);
		const monthName = new Intl.DateTimeFormat("ar-PS", {
			timeZone: PALESTINE_TZ,
			month: "long",
		}).format(d);
		return `${dayName}، ${dayNum} ${monthName}`;
	}, [searchQuery.selectedDate]);

	// عدم وجود طلاب
	if (students.length === 0) {
		return (
			<div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto space-y-4">
				<AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
				<h3 className="font-extrabold text-lg">لم تقم بإضافة طلاب بعد</h3>
				<p className="text-xs text-muted-foreground">
					يجب عليك إضافة طالب واحد على الأقل لحسابك لتتمكن من حجز الحصص والدروس.
				</p>
				<button
					onClick={() => router.push("/dashboard/parent/students")}
					className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer"
				>
					اذهب لإضافة طالب
				</button>
			</div>
		);
	}

	// حالة النجاح
	if (success) {
		return (
			<div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
				<div className="text-center py-8 space-y-3">
					<div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
						<CheckCircle className="h-10 w-10" />
					</div>
					<h2 className="text-xl font-bold">تم إرسال طلب الحجز بنجاح!</h2>
					<p className="text-xs text-muted-foreground">
						بانتظار موافقة المعلم وتأكيد الحجز. يتم نقلك الآن...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto space-y-4">
			{createdBooking && (
				<PaymentModal
					bookingId={createdBooking.id}
					price={createdBooking.price}
					onClose={() => {
						setCreatedBooking(null);
						setSuccess(true);
						setTimeout(() => {
							router.push("/dashboard/parent/bookings");
						}, 1500);
					}}
				/>
			)}

			{/* شريط الخطوات */}
			<div className="flex items-center gap-2 mb-2">
				{[
					{ key: "search", label: "بحث", icon: Search },
					{ key: "results", label: "النتائج", icon: User },
					{ key: "details", label: "التأكيد", icon: BookCheck },
				].map((step, idx) => {
					const StepIcon = step.icon;
					const isActive = currentStep === step.key;
					const stepIndex = ["search", "results", "details"].indexOf(
						currentStep,
					);
					const thisIndex = idx;
					const isPast = thisIndex < stepIndex;

					return (
						<div key={step.key} className="flex items-center gap-2 flex-1">
							<div
								className={cn(
									"flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all flex-1 justify-center",
									isActive
										? "bg-primary text-primary-foreground shadow-md"
										: isPast
											? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
											: "bg-muted text-muted-foreground",
								)}
							>
								<StepIcon className="h-3.5 w-3.5" />
								{step.label}
							</div>
							{idx < 2 && (
								<div
									className={cn(
										"h-0.5 w-4 rounded-full flex-shrink-0",
										isPast ? "bg-emerald-400" : "bg-border",
									)}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* ═══ الخطوة 1: البحث ═══ */}
			{currentStep === "search" && (
				<TimeSearchStep
					searchQuery={searchQuery}
					handleSearchChange={handleSearchChange}
					subjects={subjects}
					minDateString={minDateString}
					timeOptions={timeOptions}
					handleSearch={handleSearch}
					searching={searching}
					searchError={searchError}
				/>
			)}

			{/* ═══ الخطوة 2: النتائج ═══ */}
			{currentStep === "results" && (
				<TeacherSelectionStep
					searchQuery={searchQuery}
					selectedDateLabel={selectedDateLabel}
					selectedTimeLabel={selectedTimeLabel}
					availableTeachers={availableTeachers}
					setCurrentStep={setCurrentStep}
					handleSelectTeacher={handleSelectTeacher}
				/>
			)}

			{/* ═══ الخطوة 3: تفاصيل الحجز ═══ */}
			{currentStep === "details" && bookingDetails.selectedTeacher && (
				<BookingDetailsStep
					bookingDetails={bookingDetails}
					handleBookingChange={handleBookingChange}
					handleBookingSubmit={handleBookingSubmit}
					setCurrentStep={setCurrentStep}
					searchQuery={searchQuery}
					selectedDateLabel={selectedDateLabel}
					selectedTimeLabel={selectedTimeLabel}
					students={students}
					hasUsedTrial={hasUsedTrial}
					errorMsg={errorMsg}
					loading={loading}
				/>
			)}
		</div>
	);
}
