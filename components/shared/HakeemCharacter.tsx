"use client";

import { cn } from "@/lib/utils";

interface HakeemCharacterProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeClasses = {
	sm: "w-16 h-16",
	md: "w-24 h-24",
	lg: "w-36 h-36",
};

export default function HakeemCharacter({
	size = "md",
	className,
}: HakeemCharacterProps) {
	return (
		<div
			className={cn(
				"relative flex items-center justify-center pointer-events-none select-none",
				sizeClasses[size],
				className,
			)}
		>
			<svg
				viewBox="0 0 200 200"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="w-full h-full drop-shadow-[0_8px_16px_rgba(99,102,241,0.12)]"
			>
				{/* Owl Ears / Tufts */}
				<path d="M40 70 L30 35 L70 55 Z" fill="#4F46E5" />
				<path d="M160 70 L170 35 L130 55 Z" fill="#4F46E5" />

				{/* Owl Main Body */}
				<circle cx="100" cy="110" r="70" fill="#6366F1" />
				{/* Owl Chest (White Patch) */}
				<ellipse cx="100" cy="125" rx="45" ry="35" fill="#F8FAFC" />

				{/* Owl Head Cover / Brow */}
				<path d="M40 75 Q100 50 160 75 Q100 95 40 75 Z" fill="#4F46E5" />

				{/* Outer Eyes (White) */}
				<circle
					cx="70"
					cy="90"
					r="24"
					fill="#FFFFFF"
					stroke="#4F46E5"
					strokeWidth="3"
				/>
				<circle
					cx="130"
					cy="90"
					r="24"
					fill="#FFFFFF"
					stroke="#4F46E5"
					strokeWidth="3"
				/>

				{/* Pupils (Black with White reflection highlight) */}
				<circle cx="74" cy="92" r="10" fill="#0F172A" />
				<circle cx="76" cy="88" r="3.5" fill="#FFFFFF" />
				<circle cx="126" cy="92" r="10" fill="#0F172A" />
				<circle cx="128" cy="88" r="3.5" fill="#FFFFFF" />

				{/* Round Glasses Frames (Gold/Yellow) */}
				<circle
					cx="70"
					cy="90"
					r="26"
					stroke="#FACC15"
					strokeWidth="4"
					fill="none"
				/>
				<circle
					cx="130"
					cy="90"
					r="26"
					stroke="#FACC15"
					strokeWidth="4"
					fill="none"
				/>
				{/* Glasses Bridge */}
				<path
					d="M96 90 L104 90"
					stroke="#FACC15"
					strokeWidth="4"
					strokeLinecap="round"
				/>
				{/* Glasses Side Frames */}
				<path
					d="M44 90 L34 85"
					stroke="#FACC15"
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<path
					d="M156 90 L166 85"
					stroke="#FACC15"
					strokeWidth="3"
					strokeLinecap="round"
				/>

				{/* Orange Beak */}
				<path d="M100 98 L92 112 L108 112 Z" fill="#F97316" />

				{/* Cute Pink Cheeks */}
				<circle cx="48" cy="110" r="8" fill="#FDA4AF" opacity="0.6" />
				<circle cx="152" cy="110" r="8" fill="#FDA4AF" opacity="0.6" />

				{/* Keffiyeh Scarf wrapped around neck (Traditional Palestinian Pattern styled as SVG shapes) */}
				{/* Scarf Base */}
				<path
					d="M60 160 Q100 175 140 160 Q150 178 135 185 Q100 195 65 185 Q50 178 60 160 Z"
					fill="#EF4444"
				/>
				<path
					d="M60 160 Q100 175 140 160 Q150 178 135 185 Q100 195 65 185 Q50 178 60 160 Z"
					fill="#FFFFFF"
					clipPath="url(#scarf-clip)"
				/>

				{/* Scarf Pattern (Checkered) */}
				<g stroke="#000000" strokeWidth="1.5" opacity="0.8">
					<path d="M 50,150 L 150,195" />
					<path d="M 60,150 L 160,195" />
					<path d="M 70,150 L 170,195" />
					<path d="M 80,150 L 180,195" />

					<path d="M 150,150 L 50,195" />
					<path d="M 140,150 L 40,195" />
					<path d="M 130,150 L 30,195" />
					<path d="M 120,150 L 20,195" />
				</g>

				{/* Red border accent for the keffiyeh */}
				<path
					d="M56 160 Q100 176 144 160"
					stroke="#EF4444"
					strokeWidth="4"
					strokeLinecap="round"
				/>
				<path
					d="M62 184 Q100 196 138 184"
					stroke="#EF4444"
					strokeWidth="3"
					strokeLinecap="round"
				/>

				{/* Little tassels at the bottom of the scarf */}
				<circle cx="70" cy="188" r="2.5" fill="#000000" />
				<circle cx="85" cy="192" r="2.5" fill="#000000" />
				<circle cx="100" cy="194" r="2.5" fill="#000000" />
				<circle cx="115" cy="192" r="2.5" fill="#000000" />
				<circle cx="130" cy="188" r="2.5" fill="#000000" />
			</svg>
		</div>
	);
}
