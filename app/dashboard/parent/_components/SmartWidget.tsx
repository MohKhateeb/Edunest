"use client";

import InteractiveMessage from "@/components/shared/InteractiveMessage";

interface SmartWidgetProps {
	hakeemMessage: string;
	najeebMessage: string;
	najeebMode: "welcome" | "study" | "success" | "help";
}

export default function SmartWidget({
	hakeemMessage,
	najeebMessage,
	najeebMode,
}: SmartWidgetProps) {
	return (
		<div className="space-y-4">
			<InteractiveMessage
				character="hakeem"
				message={hakeemMessage}
				mood="advice"
			/>
			<InteractiveMessage
				character="najeeb"
				message={najeebMessage}
				mood="encouraging"
				najeebMode={najeebMode}
			/>
		</div>
	);
}
