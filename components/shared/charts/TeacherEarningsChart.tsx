"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatPrice } from "@/lib/utils";

interface ChartDataPoint {
	date: string;
	earnings: number;
	sessions: number;
}

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

interface TeacherEarningsChartProps {
	data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-card border border-border p-3 rounded-lg shadow-lg rtl text-right">
				<p className="font-bold text-sm mb-2">{label}</p>
				<div className="space-y-1">
					<p className="text-emerald-600 text-sm font-semibold flex justify-between gap-4">
						<span>الأرباح:</span>
						<span>{formatPrice(payload[0].value)}</span>
					</p>
					<p className="text-blue-600 text-sm font-semibold flex justify-between gap-4">
						<span>الجلسات:</span>
						<span>{payload[1].value}</span>
					</p>
				</div>
			</div>
		);
	}
	return null;
};

export default function TeacherEarningsChart({
	data,
}: TeacherEarningsChartProps) {
	// If no data, show a placeholder
	if (!data || data.length === 0) {
		return (
			<div className="h-64 flex items-center justify-center text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed border-border">
				لا توجد بيانات كافية لعرض الرسم البياني.
			</div>
		);
	}

	return (
		<div className="h-72 w-full mt-4">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart
					data={data}
					margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
					className="rtl-chart"
				>
					<defs>
						<linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
							<stop
								offset="5%"
								stopColor="hsl(172 66% 32%)"
								stopOpacity={0.3}
							/>
							<stop offset="95%" stopColor="hsl(172 66% 32%)" stopOpacity={0} />
						</linearGradient>
						<linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
							<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid
						strokeDasharray="3 3"
						vertical={false}
						stroke="hsl(var(--border))"
					/>
					<XAxis
						dataKey="date"
						axisLine={false}
						tickLine={false}
						tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
						dy={10}
					/>
					<YAxis
						yAxisId="left"
						axisLine={false}
						tickLine={false}
						tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
						tickFormatter={(value) => `₪${value}`}
					/>
					<YAxis
						yAxisId="right"
						orientation="right"
						axisLine={false}
						tickLine={false}
						tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
						hide
					/>
					<Tooltip content={<CustomTooltip />} />
					<Area
						yAxisId="left"
						type="monotone"
						dataKey="earnings"
						stroke="hsl(var(--primary))"
						strokeWidth={2}
						fillOpacity={1}
						fill="url(#colorEarnings)"
						name="الأرباح"
					/>
					<Area
						yAxisId="right"
						type="monotone"
						dataKey="sessions"
						stroke="#3b82f6"
						strokeWidth={2}
						fillOpacity={1}
						fill="url(#colorSessions)"
						name="الجلسات"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
