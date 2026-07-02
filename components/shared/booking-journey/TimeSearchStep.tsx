import {
	AlertCircle,
	BookOpen,
	Calendar,
	Clock,
	Loader2,
	Search,
	User,
} from "lucide-react";
import type { Student } from "@/types/booking";

type TimeSearchStepProps = {
	searchQuery: {
		selectedStudentId: string;
		selectedSpec: string;
		selectedDate: string;
		selectedTime: string;
	};
	handleSearchChange: (name: string, value: string) => void;
	students: Student[];
	subjects: { id: string; name: string }[];
	minDateString: string;
	timeOptions: { value: string; label: string }[];
	handleSearch: () => void;
	searching: boolean;
	searchError: string | null;
};

export function TimeSearchStep({
	searchQuery,
	handleSearchChange,
	students,
	subjects,
	minDateString,
	timeOptions,
	handleSearch,
	searching,
	searchError,
}: TimeSearchStepProps) {
	return (
		<div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 animate-fadeIn">
			<h2 className="font-extrabold text-xl border-b border-border pb-3 flex items-center gap-2">
				<Search className="h-5 w-5 text-primary" />
				ابحث عن معلم بالوقت والمادة
			</h2>

			{searchError && (
				<div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
					<AlertCircle className="h-4 w-4" />
					<span>{searchError}</span>
				</div>
			)}

			{/* اختيار الطالب */}
			<div className="space-y-1.5">
				<label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
					<User className="h-4 w-4" />
					الطالب المستهدف
				</label>
				<select
					value={searchQuery.selectedStudentId}
					onChange={(e) => handleSearchChange("selectedStudentId", e.target.value)}
					className="w-full premium-input text-xs"
				>
					<option value="" disabled>
						اختر الطالب
					</option>
					{students.map((s) => (
						<option key={s.id} value={s.id}>
							{s.name} (الصف {s.grade})
						</option>
					))}
				</select>
			</div>

			{/* اختيار المادة */}
			<div className="space-y-1.5">
				<label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
					<BookOpen className="h-4 w-4" />
					المادة الدراسية / التخصص
				</label>
				<select
					value={searchQuery.selectedSpec}
					onChange={(e) => handleSearchChange("selectedSpec", e.target.value)}
					className="w-full premium-input text-xs"
				>
					<option value="" disabled>
						اختر المادة
					</option>
					{subjects.length === 0 ? (
						<option value="" disabled>
							لا توجد مواد متاحة حالياً
						</option>
					) : (
						subjects.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))
					)}
				</select>
			</div>

			{/* اختيار التاريخ */}
			<div className="space-y-1.5">
				<label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
					<Calendar className="h-4 w-4" />
					التاريخ المطلوب
				</label>
				<input
					type="date"
					min={minDateString}
					value={searchQuery.selectedDate}
					onChange={(e) => handleSearchChange("selectedDate", e.target.value)}
					className="w-full premium-input text-xs cursor-pointer"
				/>
			</div>

			{/* اختيار الوقت */}
			<div className="space-y-1.5">
				<label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
					<Clock className="h-4 w-4" />
					الوقت المفضل (بتوقيت فلسطين)
				</label>
				<select
					value={searchQuery.selectedTime}
					onChange={(e) => handleSearchChange("selectedTime", e.target.value)}
					className="w-full premium-input text-xs"
				>
					<option value="">-- اختر الوقت --</option>
					{timeOptions.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>

			{/* زر البحث */}
			<button
				type="button"
				onClick={handleSearch}
				disabled={searching}
				className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
			>
				{searching ? (
					<>
						<Loader2 className="h-4.5 w-4.5 animate-spin" />
						جاري البحث عن معلمين متاحين...
					</>
				) : (
					<>
						<Search className="h-4.5 w-4.5" />
						ابحث عن المعلمين المتاحين
					</>
				)}
			</button>
		</div>
	);
}
