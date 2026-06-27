import { ArrowRight } from "lucide-react";
import Link from "next/link";
import CharacterDialogue from "@/components/shared/booking-journey/CharacterDialogue";

interface BookingJourneyHeaderProps {
	title: string;
	subtitle: string;
	character: "hakeem" | "najeeb";
	characterMessage: string;
	characterMode?: "default" | "success" | "warning" | "error";
	backLink?: string;
	backText?: string;
}

export default function BookingJourneyHeader({
	title,
	subtitle,
	character,
	characterMessage,
	characterMode = "default",
	backLink = "/dashboard/parent/bookings/new",
	backText = "تغيير مسار الحجز",
}: BookingJourneyHeaderProps) {
	return (
		<>
			<div className="text-center space-y-1 mb-8">
				<h1 className="text-3xl font-black text-slate-900 dark:text-white">
					{title}
				</h1>
				<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
					{subtitle}
				</p>
			</div>

			<div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
				<Link
					href={backLink}
					className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md"
				>
					<ArrowRight className="w-4 h-4" />
					{backText}
				</Link>

				<div className="flex-1 max-w-lg">
					<CharacterDialogue
						character={character}
						najeebMode={
							character === "najeeb" ? (characterMode as any) : undefined
						}
						message={characterMessage}
						align="right"
					/>
				</div>
			</div>
		</>
	);
}
