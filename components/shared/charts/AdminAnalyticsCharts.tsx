"use client";

import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatPrice, getCurrencySymbol } from "@/lib/utils";
import { useTranslations } from "next-intl";

type DataItem = { name: string; value?: number; count?: number };
type RevenueData = { date: string; revenue: number }[];

type TooltipPayloadItem = {
	value: number | string;
	name?: string | number;
	color?: string;
	dataKey?: string | number;
	payload?: unknown;
};

type CustomTooltipProps = {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	label?: string;
};

interface AdminAnalyticsChartsProps {
	bookingStatuses: DataItem[];
	requestedSpecializations: DataItem[];
	sessionTypes: DataItem[];
	registeredGrades: DataItem[];
	revenue: RevenueData;
}

// Colors
const STATUS_COLORS: Record<string, string> = {
	PENDING: "#eab308",          // Yellow-500
	PENDING_APPROVAL: "#f59e0b", // Amber-500
	AWAITING_PAYMENT: "#f97316", // Orange-500
	CONFIRMED: "#0284c7",        // Sky-600
	COMPLETED: "#0d9488",        // Teal-600
	REJECTED: "#f43f5e",         // Rose-500
	CANCELLED: "#64748b",        // Slate-500
	EXPIRED: "#94a3b8",          // Slate-400
};

const PIE_COLORS = ["#0d9488", "#0284c7", "#8b5cf6", "#f59e0b", "#ec4899"];

const CustomRevenueTooltip = ({
	active,
	payload,
	label,
}: CustomTooltipProps) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-card border border-border p-3 rounded-lg shadow-lg">
				<p className="font-semibold text-xs mb-1 text-muted-foreground">
					{label}
				</p>
				<p className="text-primary font-bold text-sm">
					{formatPrice(payload[0].value)}
				</p>
			</div>
		);
	}
	return null;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-card border border-border p-3 rounded-lg shadow-lg">
				<p className="font-semibold text-xs mb-1 text-muted-foreground">
					{label}
				</p>
				<p className="text-primary font-bold text-sm">{payload[0].value}</p>
			</div>
		);
	}
	return null;
};

export default function AdminAnalyticsCharts({
	bookingStatuses,
	requestedSpecializations,
	sessionTypes,
	registeredGrades,
	revenue,
}: AdminAnalyticsChartsProps) {
	const t = useTranslations('common');
	const tAdmin = useTranslations('admin');

	const getStatusTranslation = (name: string) => {
		switch (name) {
			case "PENDING":
				return tAdmin("admin_chart_status_pending");
			case "PENDING_APPROVAL":
				return tAdmin("admin_chart_status_pending_approval");
			case "AWAITING_PAYMENT":
				return tAdmin("admin_chart_status_awaiting_payment");
			case "CONFIRMED":
				return tAdmin("admin_chart_status_confirmed");
			case "COMPLETED":
				return tAdmin("admin_chart_status_completed");
			case "REJECTED":
				return tAdmin("admin_chart_status_rejected");
			case "CANCELLED":
				return tAdmin("admin_chart_status_cancelled");
			case "EXPIRED":
				return tAdmin("admin_chart_status_expired");
			default:
				return name;
		}
	};

	const translatedBookingStatuses = bookingStatuses.map((item) => ({
		...item,
		rawName: item.name,
		name: getStatusTranslation(item.name),
	}));
	return (
		<div className="space-y-6 mt-8">
			{/* Row 1: Revenue & Booking Statuses */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Platform Revenue Trends */}
				<div className="glass-card rounded-2xl p-6 lg:col-span-2">
					<div className="mb-4">
						<h3 className="font-extrabold text-lg">
							{t('arbah_almnsh_akhr_14')}</h3>
						<p className="text-xs text-muted-foreground">
							{t('mjmwa_alamwlat_almhslh_mn')}</p>
					</div>
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={revenue}
								margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
							>
								<defs>
									<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="5%"
											stopColor="hsl(var(--primary))"
											stopOpacity={0.3}
										/>
										<stop
											offset="95%"
											stopColor="hsl(var(--primary))"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="hsl(var(--border))"
									opacity={0.4}
								/>
								<XAxis
									dataKey="date"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
									dy={10}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
									tickFormatter={(val) => `${getCurrencySymbol()}${val}`}
								/>
								<Tooltip content={<CustomRevenueTooltip />} />
								<Area
									type="monotone"
									dataKey="revenue"
									stroke="hsl(var(--primary))"
									strokeWidth={3}
									fillOpacity={1}
									fill="url(#colorRevenue)"
									activeDot={{
										r: 6,
										strokeWidth: 0,
										fill: "hsl(var(--primary))",
									}}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Booking Status Distribution */}
				<div className="glass-card rounded-2xl p-6">
					<div className="mb-4">
						<h3 className="font-extrabold text-lg">{t('halat_alhjwzat')}</h3>
						<p className="text-xs text-muted-foreground">
							{t('ndhrh_aamh_ala_syr')}</p>
					</div>
					<div className="h-[300px] w-full flex items-center justify-center">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={translatedBookingStatuses}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={90}
									paddingAngle={5}
									dataKey="value"
									stroke="none"
								>
									{translatedBookingStatuses.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={STATUS_COLORS[entry.rawName] || "#94a3b8"}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										borderRadius: "12px",
										border: "1px solid hsl(var(--border))",
										backgroundColor: "hsl(var(--card))",
										color: "hsl(var(--foreground))",
									}}
									itemStyle={{ fontWeight: "bold" }}
								/>
								<Legend
									verticalAlign="bottom"
									height={36}
									iconType="circle"
									formatter={(value) => (
										<span className="text-xs font-semibold text-foreground/80 ms-2">
											{value}
										</span>
									)}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			{/* Row 2: Most Requested Specializations & Session Types */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Most Requested Specializations */}
				<div className="glass-card rounded-2xl p-6">
					<div className="mb-4">
						<h3 className="font-extrabold text-lg">{t('akthr_altkhssat_tlba')}</h3>
						<p className="text-xs text-muted-foreground">
							{t('add_alhjwzat_alfalyh_hsb')}</p>
					</div>
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={requestedSpecializations}
								layout="vertical"
								margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									horizontal={true}
									vertical={false}
									stroke="hsl(var(--border))"
									opacity={0.4}
								/>
								<XAxis
									type="number"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
									allowDecimals={false}
								/>
								<YAxis
									dataKey="name"
									type="category"
									axisLine={false}
									tickLine={false}
									tick={{
										fontSize: 11,
										fill: "hsl(var(--muted-foreground))",
										fontWeight: 600,
									}}
									dx={-10}
								/>
								<Tooltip
									cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
									content={<CustomTooltip />}
								/>
								<Bar
									dataKey="count"
									name={t('alhjwzat')}
									fill="hsl(var(--primary))"
									radius={[0, 6, 6, 0]}
									barSize={25}
								>
									{requestedSpecializations.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={PIE_COLORS[index % PIE_COLORS.length]}
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Most Requested Session Types */}
				<div className="glass-card rounded-2xl p-6">
					<div className="mb-4">
						<h3 className="font-extrabold text-lg">{t('anwaa_aljlsat_almfdlh')}</h3>
						<p className="text-xs text-muted-foreground">
							{t('twzya_alhjwzat_bnaa_ala')}</p>
					</div>
					<div className="h-[300px] w-full flex items-center justify-center">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={sessionTypes}
									cx="50%"
									cy="50%"
									innerRadius={0}
									outerRadius={100}
									paddingAngle={2}
									dataKey="count"
									stroke="none"
									labelLine={false}
									label={({
										cx = 0,
										cy = 0,
										midAngle = 0,
										innerRadius = 0,
										outerRadius = 0,
										percent = 0,
									}: {
										cx?: number;
										cy?: number;
										midAngle?: number;
										innerRadius?: number;
										outerRadius?: number;
										percent?: number;
										index?: number;
									}) => {
										const RADIAN = Math.PI / 180;
										const radius =
											innerRadius + (outerRadius - innerRadius) * 0.5;
										const x = cx + radius * Math.cos(-midAngle * RADIAN);
										const y = cy + radius * Math.sin(-midAngle * RADIAN);
										return percent > 0.05 ? (
											<text
												x={x}
												y={y}
												fill="white"
												textAnchor={x > cx ? "start" : "end"}
												dominantBaseline="central"
												className="text-[10px] font-bold"
											>
												{`${(percent * 100).toFixed(0)}%`}
											</text>
										) : null;
									}}
								>
									{sessionTypes.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={PIE_COLORS[index % PIE_COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										borderRadius: "12px",
										border: "1px solid hsl(var(--border))",
										backgroundColor: "hsl(var(--card))",
										color: "hsl(var(--foreground))",
									}}
									itemStyle={{ fontWeight: "bold" }}
								/>
								<Legend
									verticalAlign="bottom"
									height={36}
									iconType="circle"
									formatter={(value) => (
										<span className="text-xs font-semibold text-foreground/80 ms-2">
											{value}
										</span>
									)}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			{/* Row 3: Most Registered Grades */}
			<div className="glass-card rounded-2xl p-6">
				<div className="mb-4">
					<h3 className="font-extrabold text-lg">{t('altlab_almsjlyn_hsb_alsfwf')}</h3>
					<p className="text-xs text-muted-foreground">
						{t('twzya_qaadh_altlab_bnaa')}</p>
				</div>
				<div className="h-[300px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={registeredGrades}
							margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke="hsl(var(--border))"
								opacity={0.4}
							/>
							<XAxis
								dataKey="name"
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 11,
									fill: "hsl(var(--muted-foreground))",
									fontWeight: 600,
								}}
								dy={10}
							/>
							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
								allowDecimals={false}
							/>
							<Tooltip
								cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
								content={<CustomTooltip />}
							/>
							<Bar
								dataKey="count"
								name={t('add_altlab')}
								fill="#0ea5e9"
								radius={[6, 6, 0, 0]}
								barSize={40}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
