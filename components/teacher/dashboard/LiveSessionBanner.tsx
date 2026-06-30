interface LiveSessionBannerProps {
	liveSession: any | null;
}

export default function LiveSessionBanner({ liveSession }: LiveSessionBannerProps) {
	if (!liveSession) return null;

	return (
		<div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 shadow-xl shadow-rose-500/20 text-white animate-in zoom-in duration-300 relative overflow-hidden border border-rose-400/30">
			<div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
			<div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<span className="relative flex h-3 w-3">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
							<span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
						</span>
						<h2 className="font-black text-xl text-white">الجلسة الفورية بدأت الآن!</h2>
					</div>
					<p className="text-white/90 text-sm font-semibold">
						تم الدفع بنجاح. الطالب {liveSession.student.name} بانتظارك في الجلسة.
					</p>
				</div>
				{liveSession.meetingUrl ? (
					<a
						href={liveSession.meetingUrl}
						target="_blank"
						rel="noreferrer"
						className="bg-white text-rose-600 hover:bg-rose-50 px-8 py-3 rounded-xl font-black shadow-lg transition-transform hover:scale-105 whitespace-nowrap text-center"
					>
						ادخل الجلسة الآن
					</a>
				) : (
					<div className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold">جاري تجهيز الرابط...</div>
				)}
			</div>
		</div>
	);
}
