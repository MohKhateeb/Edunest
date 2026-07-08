"use client";

import {
	BookOpen,
	FileDown,
	GraduationCap,
	HelpCircle,
	Search,
	Shield,
	User,
	Video,
} from "lucide-react";
import { useState } from "react";
import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import { useTranslations } from "next-intl";

export default function HelpPage() {
	const t = useTranslations("help");
	const [activeTab, setActiveTab] = useState<
		"GENERAL" | "PARENT" | "TEACHER" | "ADMIN" | "FAQ"
	>("GENERAL");
	const [searchQuery, setSearchQuery] = useState("");

	// الأسئلة الشائعة
	const faqs = [
		{
			category: "GENERAL",
			question: t('faq_q1'),
			answer:
				t('faq_a1'),
		},
		{
			category: "PARENT",
			question: t('faq_q2'),
			answer:
				t('faq_a2'),
		},
		{
			category: "PARENT",
			question: t('faq_q3'),
			answer: t('faq_a3'),
		},
		{
			category: "TEACHER",
			question: t('faq_q4'),
			answer:
				t('faq_a4'),
		},
		{
			category: "TEACHER",
			question: t('faq_q5'),
			answer:
				t('faq_a5'),
		},
		{
			category: "ADMIN",
			question: t('faq_q6'),
			answer:
				t('faq_a6'),
		},
	];

	const filteredFaqs = faqs.filter((faq) => {
		const matchesSearch =
			faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
			faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = activeTab === "FAQ" || faq.category === activeTab;
		return matchesSearch && matchesCategory;
	});

	return (
		<div className="min-h-screen flex flex-col bg-background">
			<Header />

			{/* 🌟 Hero Section */}
			<section className="relative overflow-hidden bg-linear-to-b from-primary/10 via-background to-background py-16 border-b border-border/60">
				<div className="max-w-4xl mx-auto px-4 text-center space-y-4">
					<span className="inline-block text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
						{t('help_badge')}</span>
					<h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
						{t('help_title')}</h1>
					<p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
						{t('help_description')}
					</p>

					{/* Search Bar */}
					<div className="relative max-w-lg mx-auto pt-2">
						<Search className="absolute end-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
						<input
							type="text"
							placeholder={t('help_search_placeholder')}
							className="w-full premium-input ps-4 pe-11 py-3 text-sm rounded-xl shadow-xs"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</section>

			{/* 📑 Main Content Tabs */}
			<main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
				{/* Navigation Sidebar */}
				<aside className="lg:col-span-1 space-y-3">
					<h3 className="text-xs font-bold text-muted-foreground px-3 uppercase tracking-wider">
						{t('sidebar_title')}</h3>
					<nav className="flex flex-col gap-1.5">
						<button
							onClick={() => setActiveTab("GENERAL")}
							className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
								activeTab === "GENERAL"
									? "bg-primary text-primary-foreground shadow-sm"
									: "bg-card border border-border/40 hover:bg-muted text-foreground"
							}`}
						>
							<BookOpen className="h-4 w-4" />
							{t('tab_general')}</button>

						<button
							onClick={() => setActiveTab("PARENT")}
							className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
								activeTab === "PARENT"
									? "bg-primary text-primary-foreground shadow-sm"
									: "bg-card border border-border/40 hover:bg-muted text-foreground"
							}`}
						>
							<User className="h-4 w-4" />
							{t('tab_parent')}</button>

						<button
							onClick={() => setActiveTab("TEACHER")}
							className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
								activeTab === "TEACHER"
									? "bg-primary text-primary-foreground shadow-sm"
									: "bg-card border border-border/40 hover:bg-muted text-foreground"
							}`}
						>
							<GraduationCap className="h-4 w-4" />
							{t('tab_teacher')}</button>

						<button
							onClick={() => setActiveTab("ADMIN")}
							className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
								activeTab === "ADMIN"
									? "bg-primary text-primary-foreground shadow-sm"
									: "bg-card border border-border/40 hover:bg-muted text-foreground"
							}`}
						>
							<Shield className="h-4 w-4" />
							{t('tab_admin')}</button>

						<button
							onClick={() => setActiveTab("FAQ")}
							className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
								activeTab === "FAQ"
									? "bg-primary text-primary-foreground shadow-sm"
									: "bg-card border border-border/40 hover:bg-muted text-foreground"
							}`}
						>
							<HelpCircle className="h-4 w-4" />
							{t('tab_faq')}</button>
					</nav>

					{/* Download Manual Card */}
					<div className="bg-card border border-border rounded-2xl p-4 space-y-3 mt-6 shadow-xs">
						<h4 className="font-extrabold text-xs">{t('download_manual_title')}</h4>
						<p className="text-[10px] text-muted-foreground leading-relaxed">
							{t('download_manual_desc')}
						</p>
						<a
							href="/user_manual.html"
							target="_blank"
							className="flex items-center justify-center gap-2 w-full py-2 bg-muted text-xs font-bold rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center"
							rel="noopener"
						>
							<FileDown className="h-4 w-4" />
							{t('download_manual_btn')}</a>
					</div>
				</aside>

				{/* Content Viewer Panel */}
				<section className="lg:col-span-3 space-y-6">
					{/* Tab 1: General Platform Rules */}
					{activeTab === "GENERAL" && (
						<div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in duration-200">
							<div className="border-b border-border pb-3">
								<h2 className="text-xl font-extrabold flex items-center gap-2">
									<BookOpen className="h-5 w-5 text-primary" />
									{t('rules_title')}</h2>
								<p className="text-xs text-muted-foreground mt-1">
									{t('rules_subtitle')}</p>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
									<span className="font-bold text-xs text-primary block">
										{t('rule_cancel_title')}</span>
									<p className="text-xs text-muted-foreground leading-relaxed">
										{t('rule_cancel_desc')}
									</p>
								</div>
								<div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
									<span className="font-bold text-xs text-primary block">
										{t('rule_trial_title')}</span>
									<p className="text-xs text-muted-foreground leading-relaxed">
										{t('rule_trial_desc')}
									</p>
								</div>
								<div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
									<span className="font-bold text-xs text-primary block">
										{t('rule_commission_title')}</span>
									<p className="text-xs text-muted-foreground leading-relaxed">
										{t('rule_commission_desc')}
									</p>
								</div>
								<div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
									<span className="font-bold text-xs text-primary block">
										{t('rule_schedule_title')}</span>
									<p className="text-xs text-muted-foreground leading-relaxed">
										{t('rule_schedule_desc')}
									</p>
								</div>
							</div>

							{/* Jitsi Meet Section */}
							<div className="bg-primary/5 border border-primary/10 p-5 rounded-xl space-y-3">
								<h4 className="font-extrabold text-sm flex items-center gap-2 text-primary">
									<Video className="h-5 w-5" />
									{t('jitsi_title')}</h4>
								<p className="text-xs text-muted-foreground leading-relaxed">
									{t('jitsi_desc')}
								</p>
							</div>
						</div>
					)}

					{/* Tab 2: Parent Guide */}
					{activeTab === "PARENT" && (
						<div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in duration-200">
							<div className="border-b border-border pb-3">
								<h2 className="text-xl font-extrabold flex items-center gap-2">
									<User className="h-5 w-5 text-primary" />
									{t('guide_parent_title')}</h2>
								<p className="text-xs text-muted-foreground mt-1">
									{t('guide_parent_desc')}</p>
							</div>

							<div className="space-y-4">
								<div className="flex items-start gap-4">
									<div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
										{t('step_1')}</div>
									<div className="space-y-1">
										<h4 className="font-bold text-xs">
											{t('parent_step1_title')}</h4>
										<p className="text-xs text-muted-foreground">
											{t('parent_step1_desc')}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
										{t('step_2')}</div>
									<div className="space-y-1">
										<h4 className="font-bold text-xs">
											{t('parent_step2_title')}</h4>
										<p className="text-xs text-muted-foreground">
											{t('parent_step2_desc')}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
										{t('step_3')}</div>
									<div className="space-y-1">
										<h4 className="font-bold text-xs">
											{t('parent_step3_title')}</h4>
										<p className="text-xs text-muted-foreground">
											{t('parent_step3_desc')}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
										{t('step_4')}</div>
									<div className="space-y-1">
										<h4 className="font-bold text-xs">
											{t('parent_step4_title')}</h4>
										<p className="text-xs text-muted-foreground">
											{t('parent_step4_desc')}
										</p>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Tab 3: Teacher Guide */}
					{activeTab === "TEACHER" && (
						<div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in duration-200">
							<div className="border-b border-border pb-3">
								<h2 className="text-xl font-extrabold flex items-center gap-2">
									<GraduationCap className="h-5 w-5 text-primary" />
									{t('guide_teacher_title')}</h2>
								<p className="text-xs text-muted-foreground mt-1">
									{t('guide_teacher_desc')}</p>
							</div>

							<div className="space-y-4">
								<div className="flex items-start gap-4">
									<div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
										{t('step_1')}</div>
									<div className="space-y-1">
										<h4 className="font-bold text-xs">
											{t('teacher_step1_title')}</h4>
										<p className="text-xs text-muted-foreground">
											{t('teacher_step1_desc')}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
										{t('step_2')}</div>
									<div className="space-y-1">
										<h4 className="font-bold text-xs">
											{t('teacher_step2_title')}</h4>
										<p className="text-xs text-muted-foreground">
											{t('teacher_step2_desc')}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
										{t('step_3')}</div>
									<div className="space-y-1">
										<h4 className="font-bold text-xs">
											{t('teacher_step3_title')}</h4>
										<p className="text-xs text-muted-foreground">
											{t('teacher_step3_desc')}
										</p>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Tab 4: Admin Guide */}
					{activeTab === "ADMIN" && (
						<div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in duration-200">
							<div className="border-b border-border pb-3">
								<h2 className="text-xl font-extrabold flex items-center gap-2">
									<Shield className="h-5 w-5 text-primary" />
									{t('guide_admin_title')}</h2>
								<p className="text-xs text-muted-foreground mt-1">
									{t('guide_admin_desc')}</p>
							</div>

							<div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
								<div className="p-3 bg-muted/40 rounded-lg">
									<strong className="text-foreground font-semibold block mb-0.5">
										{t('admin_step1_title')}</strong>
									{t('admin_step1_desc')}
								</div>
								<div className="p-3 bg-muted/40 rounded-lg">
									<strong className="text-foreground font-semibold block mb-0.5">
										{t('admin_step2_title')}</strong>
									{t('admin_step2_desc')}
								</div>
								<div className="p-3 bg-muted/40 rounded-lg">
									<strong className="text-foreground font-semibold block mb-0.5">
										{t('admin_step3_title')}</strong>
									{t('admin_step3_desc')}
								</div>
							</div>
						</div>
					)}

					{/* Tab 5: FAQ & Search Results */}
					{(activeTab === "FAQ" || searchQuery !== "") && (
						<div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200">
							<div className="border-b border-border pb-3">
								<h2 className="text-xl font-extrabold flex items-center gap-2">
									<HelpCircle className="h-5 w-5 text-primary" />
									{t('faq_title')}</h2>
								<p className="text-xs text-muted-foreground mt-1">
									{t('faq_desc')}</p>
							</div>

							<div className="space-y-4 divide-y divide-border/60">
								{filteredFaqs.length === 0 ? (
									<p className="text-xs text-muted-foreground py-10 text-center">
										{t('faq_no_results')}</p>
								) : (
									filteredFaqs.map((faq, index) => (
										<div
											key={index}
											className={`pt-4 ${index === 0 ? "pt-0" : ""} space-y-1.5`}
										>
											<h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
												<span className="h-2 w-2 rounded-full bg-primary"></span>
												{faq.question}
											</h4>
											<p className="text-xs text-muted-foreground leading-relaxed ps-3">
												{faq.answer}
											</p>
										</div>
									))
								)}
							</div>
						</div>
					)}
				</section>
			</main>

			<Footer />
		</div>
	);
}
