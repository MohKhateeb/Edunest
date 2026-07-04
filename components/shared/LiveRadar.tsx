"use client";

import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Loader2,
	Wifi,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { claimLiveRequest } from "@/lib/actions/tutoring-requests/instant-book";
import { cn, formatLocalTime } from "@/lib/utils";
import { useTranslations } from "next-intl";

type LiveRequest = {
	id: string;
	student: { name: string; grade: number };
	specialization: string;
	title: string;
	price: number;
	duration: number;
	createdAt: Date;
};

interface LiveRadarProps {
	teacherId: string;
	initialRequests: LiveRequest[];
	isAvailableNow: boolean;
}

export default function LiveRadar({
	teacherId,
	initialRequests,
	isAvailableNow,
}: LiveRadarProps) {
    const t = useTranslations('common');
	const router = useRouter();
	const [requests, setRequests] = useState<LiveRequest[]>(initialRequests);
	const [isClaiming, setIsClaiming] = useState<string | null>(null);

	// Poll for new requests every 5 seconds (Simulating WebSockets for now)
	// In a real production app, this should be replaced with Supabase Realtime subscriptions
	useEffect(() => {
		if (!isAvailableNow) return;

		const interval = setInterval(() => {
			router.refresh();
		}, 5000);

		return () => clearInterval(interval);
	}, [isAvailableNow, router]);

	// Update local state when props change
	useEffect(() => {
		setRequests(initialRequests);
	}, [initialRequests]);

	const handleClaim = async (requestId: string) => {
		setIsClaiming(requestId);
		toast.loading(t('jary_altqat_altlb_alfwry'), {
			id: `claim-${requestId}`,
		});

		try {
			const res = await claimLiveRequest(requestId);
			if (res.success && res.data) {
				toast.success(t('tm_altqat_altlb_bnjah'), {
					id: `claim-${requestId}`,
				});
				// Redirect to the session lobby
				router.push(`/dashboard/session/${res.data.bookingId}`);
			} else {
				toast.error(
					!res.success ? res.error : t('athra_altqt_malm_akhr'),
					{ id: `claim-${requestId}` },
				);
			}
		} catch (error) {
			toast.error(t('hdth_khta_athnaa_alatsal'), { id: `claim-${requestId}` });
		} finally {
			setIsClaiming(null);
		}
	};

	if (!isAvailableNow) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-3xl bg-slate-50 dark:bg-slate-900/50">
				<div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 relative">
					<Wifi className="h-12 w-12 text-slate-400" />
					<div className="absolute top-2 start-2 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
				</div>
				<h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">
					{t('alradar_mtwqf_halya')}</h3>
				<p className="text-slate-500 max-w-md">
					{t('qm_btfayl_mtah_alan')}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Radar Header */}
			<div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl border border-indigo-500/20 relative overflow-hidden">
				{/* Radar Animation Rings */}
				<div className="absolute top-1/2 start-12 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500/20 animate-ping"></div>
				<div className="absolute top-1/2 start-12 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500/40"></div>

				<div className="ps-20 z-10">
					<h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
						{t('alradar_alhy_yaml')}</h2>
					<p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
						{t('nhn_nbhth_an_tlab')}</p>
				</div>
			</div>

			{/* Requests List */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{requests.length === 0 ? (
					<div className="col-span-full flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-emerald-500/20 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20">
						<Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
						<p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
							{t('alradar_ymsh_almntqh')}</p>
						<p className="text-sm text-emerald-600/70 dark:text-emerald-500/70 mt-2">
							{t('la_twjd_tlbat_fwryh')}</p>
					</div>
				) : (
					requests.map((req) => (
						<div
							key={req.id}
							className={cn(
								"relative group bg-white dark:bg-slate-900 border-2 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden",
								isClaiming === req.id
									? "border-indigo-500 scale-[0.98] opacity-80"
									: "border-emerald-500/30 hover:border-emerald-500",
							)}
						>
							{/* Ping badge */}
							<div className="absolute top-0 start-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-ee-xl shadow-sm flex items-center gap-1">
								<span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
								{t('tlb_fwry')}</div>

							<div className="mt-4 mb-6">
								<h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
									{req.title}
								</h3>
								<p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
									<span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-semibold">
										{req.specialization}
									</span>
									<span>•</span>
									<span>{t('alsf')}{req.student.grade}</span>
								</p>

								<div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
									<div className="flex-1 text-center border-e border-slate-200 dark:border-slate-700">
										<span className="block text-xs text-slate-500 mb-1">
											{t('almdh')}</span>
										<span className="font-bold flex items-center justify-center gap-1">
											<Clock className="w-3 h-3 text-emerald-500" />{" "}
											{req.duration} {t('key_1783109425977_9h4x')}</span>
									</div>
									<div className="flex-1 text-center">
										<span className="block text-xs text-slate-500 mb-1">
											{t('alsar_almwhd')}</span>
										<span className="font-bold text-indigo-600 dark:text-indigo-400">
											{req.price} ₪
										</span>
									</div>
								</div>
							</div>

							<button
								onClick={() => handleClaim(req.id)}
								disabled={isClaiming !== null}
								className={cn(
									"w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-lg transition-all",
									isClaiming === req.id
										? "bg-indigo-500 text-white"
										: isClaiming !== null
											? "bg-slate-100 text-slate-400 cursor-not-allowed"
											: "bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20",
								)}
							>
								{isClaiming === req.id ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										{t('jary_alaltqat')}</>
								) : (
									<>
										<Zap className="w-5 h-5" />
										{t('altqt_aljlsh_alan')}</>
								)}
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
}
