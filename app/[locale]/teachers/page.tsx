import { getTranslations } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import { UserService } from "@/lib/services/domain/user-service";
import { formatCurrency } from "@/lib/utils/currency";
import { locationRepository } from "@/lib/repositories/locationRepository";
import type { Metadata } from "next";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'common' });
	return {
		title: t('key_1783109427892_pzbk'),
		description: t('key_1783109427898_ci72'),
	};
}

interface SearchParams {
	subject?: string;
	city?: string;
	page?: string;
}

async function getTeachers(params: SearchParams) {
	return UserService.searchTeachers(params);
}

const GRADE_LABEL_KEYS: Record<number, string> = {
	1: "key_1783109427957_e53t",
	2: "key_1783109427963_de9z",
	3: "key_1783109427968_jq6s",
	4: "key_1783109427987_kasc",
	5: "key_1783109427993_569z",
	6: "key_1783109427998_8ikp",
	7: "key_1783109428004_vcdi",
	8: "key_1783109428009_ffra",
	9: "key_1783109428016_rsv5",
	10: "key_1783109428022_dg13",
	11: "key_1783109428028_5si7",
	12: "key_1783109428033_85m6",
};

export default async function TeachersPage({
	searchParams,
	params,
}: {
	searchParams: Promise<SearchParams>;
	params: Promise<{ locale: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'teachers' });
	const tCommon = await getTranslations({ locale, namespace: 'common' });
	const { teachers, total, page, PAGE_SIZE } = await getTeachers(resolvedSearchParams);
	const totalPages = Math.ceil(total / PAGE_SIZE);
	
	const cities = await locationRepository.getActiveCitiesByCountry("PS");

	function buildUrl(overrides: Record<string, string | undefined>) {
		const qp = new URLSearchParams();
		const merged = {
			subject: resolvedSearchParams.subject,
			city: resolvedSearchParams.city,
			page: String(page),
			...overrides,
		};
		for (const [k, v] of Object.entries(merged)) {
			if (v && v !== "1") qp.set(k, v);
		}
		const str = qp.toString();
		return `/teachers${str ? `?${str}` : ""}`;
	}

	return (
		<div className="min-h-screen flex flex-col">
			<Header />

			{/* ─── Search Header ────────────────────────────────────── */}
			<section className="bg-gradient-to-br from-[hsl(172,66%,10%)] via-[hsl(172,60%,18%)] to-[hsl(200,50%,14%)] text-white py-14">
				<div className="max-w-6xl mx-auto px-6 text-center">
					<h1 className="text-4xl font-extrabold mb-4">
						ابحث عن معلمك المثالي
					</h1>
					<p className="text-white/70 mb-8">
						{total > 0
							? `${total} معلم موثّق في انتظارك`
							: "لم يتم العثور على معلمين بهذه المعايير"}
					</p>

					{/* Search form */}
					<form
						id="teachers-search-form"
						method="get"
						action="/teachers"
						className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
					>
						<input
							name="subject"
							id="search-subject"
							defaultValue={resolvedSearchParams.subject}
							placeholder="التخصص (رياضيات، فيزياء...)"
							className="flex-1 rounded-xl px-4 py-3 text-foreground bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
						/>
						<select
							name="city"
							id="search-city"
							defaultValue={resolvedSearchParams.city}
							className="rounded-xl px-4 py-3 text-foreground bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
						>
							<option value="">جميع المدن</option>
							{cities.map((c) => (
								<option key={c.slug} value={c.slug}>
									{locale === 'en' ? c.nameEn : c.nameAr}
								</option>
							))}
						</select>
						<button
							type="submit"
							id="search-submit-btn"
							className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl px-6 py-3 text-sm transition-colors"
						>
							بحث
						</button>
					</form>

					{/* Active filters */}
					{(resolvedSearchParams.subject || resolvedSearchParams.city) && (
						<div className="flex flex-wrap justify-center gap-2 mt-4">
							{resolvedSearchParams.subject && (
								<span className="bg-white/15 border border-white/25 rounded-full px-3 py-1 text-xs flex items-center gap-2">
									{resolvedSearchParams.subject}
									<Link
										href={buildUrl({ subject: undefined, page: "1" })}
										className="hover:text-red-300"
									>
										✕
									</Link>
								</span>
							)}
							{resolvedSearchParams.city && (
								<span className="bg-white/15 border border-white/25 rounded-full px-3 py-1 text-xs flex items-center gap-2">
									{resolvedSearchParams.city}
									<Link
										href={buildUrl({ city: undefined, page: "1" })}
										className="hover:text-red-300"
									>
										✕
									</Link>
								</span>
							)}
							<Link
								href="/teachers"
								className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-full px-3 py-1 text-xs text-red-200"
							>
								مسح الكل
							</Link>
						</div>
					)}
				</div>
			</section>

			{/* ─── Results Grid ─────────────────────────────────────── */}
			<section className="flex-1 py-12 bg-muted/30">
				<div className="max-w-6xl mx-auto px-6">
					{teachers.length === 0 ? (
						<div className="text-center py-24">
							<div className="text-6xl mb-4">🔍</div>
							<h2 className="text-2xl font-bold mb-2">
								لم يتم العثور على معلمين
							</h2>
							<p className="text-muted-foreground mb-6">
								حاول تغيير معايير البحث أو تصفح جميع المعلمين.
							</p>
							<Link
								href="/teachers"
								className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
							>
								عرض جميع المعلمين
							</Link>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{teachers.map((teacher) => {
								const minPriceService = teacher.services.reduce((min, s) => Number(s.price) < Number(min.price) ? s : min, teacher.services[0]);
								const minPrice = minPriceService ? Number(minPriceService.price) : null;
								const minCurrency = minPriceService?.currency;
								return (
									<Link
										key={teacher.id}
										href={`/teachers/${teacher.slug}`}
										id={`teacher-card-${teacher.id}`}
										className="hover-card glow-effect group bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
									>
										{/* Avatar */}
										<div className="relative h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
											{teacher.profileImageUrl ? (
												<Image
													src={teacher.profileImageUrl}
													alt={teacher.user.name}
													width={64}
													height={64}
													className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
												/>
											) : (
												<div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary border-4 border-white shadow-md">
													{teacher.user.name.charAt(0)}
												</div>
											)}
											{teacher.verificationLevel !== "NONE" && (
												<span className="absolute top-2 start-2 text-xs bg-white/90 dark:bg-card/90 rounded-full px-2 py-0.5 font-bold shadow-sm">
													{teacher.verificationLevel === "GOLD"
														? "🥇"
														: teacher.verificationLevel === "SILVER"
															? "🥈"
															: "🥉"}
												</span>
											)}
										</div>

										{/* Info */}
										<div className="p-4 flex flex-col flex-1">
											<h2 className="font-bold text-sm group-hover:text-primary transition-colors mb-0.5 truncate">
												{teacher.user.name}
											</h2>
											<p className="text-xs text-muted-foreground mb-1 truncate">
												{teacher.subjects?.map((s) => s.subject.name).join(", ") ||
													tCommon('ghyr_mhdd')}
												{teacher.subSpecialization ? ` · ${teacher.subSpecialization}` : ""}
											</p>
											{teacher.city && (
												<p className="text-xs text-muted-foreground mb-2">
													📍 {teacher.city}
													{teacher.area ? ` - ${teacher.area}` : ""}
												</p>
											)}
											{teacher.gradeLevels.length > 0 && (
												<p className="text-xs text-muted-foreground mb-3">
													{tCommon('key_1783109427774_cfcr')}{" "}
													{teacher.gradeLevels
														.slice(0, 3)
														.map((g) => {
															const key = GRADE_LABEL_KEYS[g];
															return key ? t(key) : String(g);
														})
														.join("، ")}
													{teacher.gradeLevels.length > 3 && " ..."}
												</p>
											)}

											<div className="mt-auto flex items-center justify-between text-xs border-t border-border pt-3">
												<span className="flex items-center gap-1 text-amber-500 font-semibold">
													★ {Number(teacher.averageRating).toFixed(1)}
													<span className="text-muted-foreground font-normal">
														({teacher.totalReviews})
													</span>
												</span>
												{minPrice !== null && (
													<span className="font-bold text-primary">
														من {formatCurrency(minPrice, minCurrency)}
													</span>
												)}
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					)}

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex justify-center items-center gap-2 mt-12">
							{page > 1 && (
								<Link
									href={buildUrl({ page: String(page - 1) })}
									className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
								>
									السابق →
								</Link>
							)}
							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter(
									(p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages,
								)
								.map((p, i, arr) => {
									const prev = arr[i - 1];
									return (
										<>
											{prev && p - prev > 1 && (
												<span
													key={`ellipsis-${p}`}
													className="px-2 text-muted-foreground"
												>
													...
												</span>
											)}
											<Link
												key={p}
												href={buildUrl({ page: String(p) })}
												className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
													p === page
														? "bg-primary text-primary-foreground"
														: "bg-card border border-border hover:border-primary hover:text-primary"
												}`}
											>
												{p}
											</Link>
										</>
									);
								})}
							{page < totalPages && (
								<Link
									href={buildUrl({ page: String(page + 1) })}
									className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
								>
									← التالي
								</Link>
							)}
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
