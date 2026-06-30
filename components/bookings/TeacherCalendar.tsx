import {
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { useMemo } from "react";
import type { DetailedBooking } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getLocalDateString } from "@/lib/utils/time";

const MONTHS_AR = [
	"يناير",
	"فبراير",
	"مارس",
	"أبريل",
	"مايو",
	"يونيو",
	"يوليو",
	"أغسطس",
	"سبتمبر",
	"أكتوبر",
	"نوفمبر",
	"ديسمبر",
];
const WEEKDAYS_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"]; // Starting from Sunday for standard date math, but wait, usually AR calendars start Saturday or Sunday. Let's stick to standard getDay() where 0=Sunday.

interface TeacherCalendarProps {
	bookings: DetailedBooking[];
	currentDate: Date;
	setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
	selectedDateStr: string;
	setSelectedDateStr: (date: string) => void;
}

export function TeacherCalendar({
	bookings,
	currentDate,
	setCurrentDate,
	selectedDateStr,
	setSelectedDateStr,
}: TeacherCalendarProps) {
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();

	const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
	const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
	const handleToday = () => {
		const today = new Date();
		setCurrentDate(today);
		setSelectedDateStr(getLocalDateString(today));
	};

	const filteredBookingsByDate = useMemo(() => {
		const groups: Record<string, DetailedBooking[]> = {};
		bookings.forEach((booking) => {
			const dateStr = getLocalDateString(new Date(booking.startTime));
			if (!groups[dateStr]) groups[dateStr] = [];
			groups[dateStr].push(booking);
		});
		return groups;
	}, [bookings]);

	const calendarCells = useMemo(() => {
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

		const cells: { date: Date; isCurrentMonth: boolean; dateStr: string }[] =
			[];

		// Add prev month days to fill the first row
		const prevMonthDays = new Date(year, month, 0).getDate();
		for (let i = firstDayIndex - 1; i >= 0; i--) {
			const d = new Date(year, month - 1, prevMonthDays - i, 12, 0, 0);
			cells.push({
				date: d,
				isCurrentMonth: false,
				dateStr: getLocalDateString(d),
			});
		}

		// Current month days
		for (let day = 1; day <= daysInMonth; day++) {
			const d = new Date(year, month, day, 12, 0, 0);
			cells.push({
				date: d,
				isCurrentMonth: true,
				dateStr: getLocalDateString(d),
			});
		}

		// Next month days to fill the last row
		const remaining = 42 - cells.length; // 6 rows * 7 days
		for (let day = 1; day <= remaining; day++) {
			const d = new Date(year, month + 1, day, 12, 0, 0);
			cells.push({
				date: d,
				isCurrentMonth: false,
				dateStr: getLocalDateString(d),
			});
		}

		return cells;
	}, [year, month]);

	return (
		<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-5 shadow-sm">
			<div className="flex items-center justify-between mb-4">
				<h2 className="font-extrabold text-sm flex items-center gap-2">
					<CalendarIcon className="h-4.5 w-4.5 text-primary" />
					التقويم
				</h2>
				<button
					onClick={handleToday}
					className="text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 rounded-full transition-colors"
				>
					اليوم
				</button>
			</div>

			<div className="flex items-center justify-between mb-4 bg-accent/40 rounded-xl p-1.5 border border-border">
				<button
					onClick={handleNextMonth}
					className="p-1.5 hover:bg-background rounded-lg text-muted-foreground transition-colors"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
				<span className="text-xs font-black">
					{MONTHS_AR[month]} {year}
				</span>
				<button
					onClick={handlePrevMonth}
					className="p-1.5 hover:bg-background rounded-lg text-muted-foreground transition-colors"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
			</div>

			<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-2">
				{WEEKDAYS_AR.map((day) => (
					<div key={day} className="py-1">
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-1">
				{calendarCells.map(({ date, isCurrentMonth, dateStr }, i) => {
					const dayBookings = filteredBookingsByDate[dateStr] || [];
					const isSelected = dateStr === selectedDateStr;
					const isToday = dateStr === getLocalDateString(new Date());

					return (
						<button
							key={`${dateStr}-${i}`}
							onClick={() => setSelectedDateStr(dateStr)}
							className={cn(
								"relative flex flex-col items-center justify-center aspect-square rounded-xl text-xs transition-all",
								isCurrentMonth
									? "hover:bg-accent/50 cursor-pointer"
									: "text-muted-foreground/30",
								isSelected &&
									"bg-primary text-primary-foreground font-black shadow-md hover:bg-primary",
								!isSelected &&
									isToday &&
									"border border-primary text-primary font-bold bg-primary/5",
							)}
						>
							<span>{date.getDate()}</span>
							{dayBookings.length > 0 && (
								<div className="absolute bottom-1.5 flex gap-0.5">
									{dayBookings.slice(0, 3).map((b) => (
										<span
											key={b.id}
											className={cn(
												"h-1 w-1 rounded-full",
												isSelected
													? "bg-white/80"
													: (b.status === "PENDING" || b.status === "PENDING_APPROVAL")
														? "bg-amber-500"
														: b.status === "AWAITING_PAYMENT"
															? "bg-orange-500"
															: b.status === "CONFIRMED"
																? "bg-emerald-500"
																: b.status === "COMPLETED"
																	? "bg-blue-500"
																	: b.status === "REJECTED"
																		? "bg-rose-500"
																		: "bg-slate-400",
											)}
										/>
									))}
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
