"use client";

import Link from "next/link";
import React from "react";
import type { AnnouncementBannerContent } from "@/types/homepage";

export default function AnnouncementBanner({
	content,
}: {
	content: AnnouncementBannerContent;
}) {
	if (!content.isActive) return null;

	// Use user-defined colors or fallback to primary styles
	const bgColor = content.backgroundColor || "bg-primary";
	const textColor = content.textColor || "text-white";

	return (
		<div
			className={`${bgColor} ${textColor} text-center py-2 px-4 text-sm font-bold shadow-md z-50 relative`}
			dir="rtl"
		>
			{content.link ? (
				<Link
					href={content.link}
					className="hover:underline flex items-center justify-center gap-2"
				>
					<span>{content.text}</span>
				</Link>
			) : (
				<span>{content.text}</span>
			)}
		</div>
	);
}
