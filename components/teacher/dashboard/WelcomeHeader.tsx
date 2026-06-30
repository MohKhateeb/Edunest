import Link from "next/link";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import TeacherOnlineToggle from "@/components/shared/TeacherOnlineToggle";

interface WelcomeHeaderProps {
	teacherName: string;
	teacherSlug: string;
	isAvailableNow: boolean;
}

export default function WelcomeHeader({ teacherName, teacherSlug, isAvailableNow }: WelcomeHeaderProps) {
	return (
		<div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
			<InteractiveMessage
				character="najeeb"
				title={`أهلاً بك، أ. ${teacherName} 👋`}
				message="من لوحة التحكم يمكنك قبول حجوزات الطلاب، إدارة أوقات فراغك، ومتابعة أرباحك بسلاسة."
				najeebMode="welcome"
				className="lg:w-1/2"
			/>
			<div className="flex flex-col gap-3 shrink-0">
				<TeacherOnlineToggle initialStatus={isAvailableNow} />

				<div className="text-left bg-gradient-to-l from-primary to-blue-400 px-6 py-4 rounded-2xl shadow-md text-white animate-pulse-soft">
					<span className="text-xs text-white/80 block mb-1">رابط صفحتك العامة للطلاب</span>
					<Link
						href={`/teachers/${teacherSlug}`}
						className="text-sm font-black hover:underline flex items-center gap-1"
					>
						<span>edunest.com/teachers/{teacherSlug}</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
