"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ReportModal from "@/components/shared/ReportModal";

interface JitsiMeetingRoomProps {
	roomName: string;
	userName: string;
	bookingId: string;
	role: "TEACHER" | "PARENT";
	startTime: Date;
	durationMinutes: number;
}

export default function JitsiMeetingRoom({
	roomName,
	userName,
	bookingId,
	role,
	startTime,
	durationMinutes,
}: JitsiMeetingRoomProps) {
	const router = useRouter();
	const [api, setApi] = useState<any>(null);
	const [timeLeft, setTimeLeft] = useState<number | null>(null);
	const [sessionEnded, setSessionEnded] = useState(false);

	// States for report modal
	const [showReportModal, setShowReportModal] = useState(false);

	const sessionEndMs = new Date(startTime).getTime() + durationMinutes * 60_000;

	useEffect(() => {
		if (sessionEnded) return;

		const interval = setInterval(() => {
			const now = Date.now();
			const remaining = sessionEndMs - now;

			if (remaining <= 0) {
				setTimeLeft(0);
				endSession();
			} else {
				setTimeLeft(Math.floor(remaining / 1000));
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [sessionEndMs, sessionEnded]);

	const endSession = () => {
		setSessionEnded(true);
		if (api) {
			api.executeCommand("hangup");
			api.dispose();
		}

		// If it's the teacher, show report modal
		if (role === "TEACHER") {
			setShowReportModal(true);
		}
	};

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};



	if (sessionEnded) {
		return (
			<div
				className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 animate-in fade-in zoom-in duration-500"
				dir="rtl"
			>
				<div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
					<CheckCircle2 className="w-12 h-12" />
				</div>
				<h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">
					انتهت الجلسة بنجاح!
				</h2>
				<p className="text-slate-500 mb-8 max-w-md">
					{role === "TEACHER"
						? "شكراً لجهودك، يرجى كتابة التقرير الختامي للطالب."
						: "شكراً لحضورك، نتمنى لك التوفيق! لا تنسَ تقييم المعلم من صفحة الحجوزات."}
				</p>

				{role === "PARENT" && (
					<button
						onClick={() => router.push("/dashboard/parent/bookings")}
						className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer"
					>
						العودة للحجوزات
					</button>
				)}

				{role === "TEACHER" && !showReportModal && (
					<button
						onClick={() => setShowReportModal(true)}
						className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
					>
						<FileText className="w-5 h-5" />
						كتابة التقرير الآن
					</button>
				)}

				{/* Report Modal */}
				{showReportModal && (
					<ReportModal
						bookingId={bookingId}
						onClose={() => setShowReportModal(false)}
						onSuccess={() => router.push("/dashboard/teacher/bookings")}
					/>
				)}
			</div>
		);
	}

	return (
		<div
			className="relative w-full h-[calc(100vh-64px)] bg-[#111] overflow-hidden flex flex-col font-sans"
			dir="ltr"
		>
			{/* Top Banner with Timer */}
			<div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/90 to-transparent z-10 flex items-center justify-between px-6 pointer-events-none">
				<div className="text-white/90 font-semibold text-sm drop-shadow-md flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
					{userName} ({role === "TEACHER" ? "المعلم" : "الطالب"})
				</div>

				{timeLeft !== null && (
					<div
						className={`flex items-center gap-2 font-mono text-xl font-bold drop-shadow-lg bg-black/40 px-4 py-1.5 rounded-full border border-white/10 ${timeLeft < 300 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}
					>
						<Clock className="w-5 h-5" />
						{formatTime(timeLeft)}
						{timeLeft < 300 && (
							<span className="text-xs ms-2 bg-rose-500/20 px-2 py-0.5 rounded text-rose-300">
								ينتهي قريباً
							</span>
						)}
					</div>
				)}
			</div>

			<div className="flex-1 w-full h-full">
				<JitsiMeeting
					domain="meet.jit.si"
					roomName={roomName}
					configOverwrite={{
						startWithAudioMuted: false,
						disableModeratorIndicator: true,
						startScreenSharing: false,
						enableEmailInStats: false,
						prejoinPageEnabled: false,
						requireDisplayName: false,
					}}
					interfaceConfigOverwrite={{
						DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
						SHOW_PROMOTIONAL_CLOSE_PAGE: false,
						SHOW_JITSI_WATERMARK: false,
						TOOLBAR_BUTTONS: [
							"microphone",
							"camera",
							"closedcaptions",
							"desktop",
							"fullscreen",
							"fodeviceselection",
							"profile",
							"chat",
							"recording",
							"livestreaming",
							"etherpad",
							"sharedvideo",
							"settings",
							"raisehand",
							"videoquality",
							"filmstrip",
							"feedback",
							"stats",
							"shortcuts",
							"tileview",
							"videobackgroundblur",
							"download",
							"help",
							"mute-everyone",
						],
					}}
					userInfo={{
						displayName: userName,
						email: "user@edunest.local", // required by TS interface
					}}
					onApiReady={(externalApi) => {
						setApi(externalApi);
					}}
					getIFrameRef={(iframeRef) => {
						iframeRef.style.height = "100%";
						iframeRef.style.width = "100%";
					}}
				/>
			</div>

			{/* Manual End Button */}
			<div className="absolute bottom-6 right-6 z-10">
				<button
					onClick={endSession}
					className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer border border-rose-400/20"
					dir="rtl"
				>
					<AlertTriangle className="w-4 h-4" />
					إنهاء الجلسة
				</button>
			</div>
		</div>
	);
}
