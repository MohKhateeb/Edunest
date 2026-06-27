import type React from "react";

interface BaseModalProps {
	onClose: () => void;
	children: React.ReactNode;
	className?: string;
}

export default function BaseModal({
	onClose,
	children,
	className = "max-w-lg",
}: BaseModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
			<div
				className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full p-6 relative ${className}`}
			>
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
				{children}
			</div>
		</div>
	);
}
