"use client";
import { useTranslations } from "next-intl";

import type { VerificationLevel } from "@prisma/client";
import { Eye, Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DataTable from "@/components/shared/DataTable";
import DetailsModal from "@/components/shared/DetailsModal";
import { rejectTeacher, verifyTeacher } from "@/lib/actions/admin";
import { VERIFICATION_BADGES_CONFIG } from "@/lib/translations";

type TeacherRow = {
	id: string;
	specialization: string;
	isVerified: boolean;
	verificationLevel: VerificationLevel;
	averageRating: number;
	totalReviews: number;
	profileImageUrl: string | null;
	user: {
		name: string;
		email: string;
	};
};

type AdminTeachersListProps = {
	teachers: TeacherRow[];
};

export default function AdminTeachersList({
	teachers,
}: AdminTeachersListProps) {
	const t = useTranslations('admin');
	const router = useRouter();
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterLevel, setFilterLevel] = useState<string>("ALL");
	const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
		null,
	);

	const handleLevelChange = async (
		teacherId: string,
		level: VerificationLevel,
	) => {
		setLoadingId(teacherId);
		if (level === "NONE") {
			await rejectTeacher(teacherId, t('verification_cancelled_by_admin'));
		} else {
			await verifyTeacher(teacherId, level);
		}
		setLoadingId(null);
		router.refresh();
	};

	const filteredTeachers = teachers.filter((teacher) => {
		const matchesSearch =
			teacher.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			teacher.user.email.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesLevel =
			filterLevel === "ALL" || teacher.verificationLevel === filterLevel;
		return matchesSearch && matchesLevel;
	});

	return (
		<div className="space-y-4">
			<DataTable
				data={filteredTeachers}
				headers={[
					t('teachers_list_header_name_specialization'),
					t('key_1783109431649_3qcs'),
					t('key_1783109431652_uexs'),
					t('teachers_list_header_verification_status'),
					t('teachers_list_header_edit_verification'),
				]}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				searchPlaceholder={t('teachers_list_search_placeholder')}
				toolbarChildren={
					<select
						className="premium-input text-sm sm:w-48 cursor-pointer"
						value={filterLevel}
						onChange={(e) => setFilterLevel(e.target.value)}
					>
						<option value="ALL">{t('verification_all_levels')}</option>
						<option value={"NONE"}>{t('key_1783109431578_3ocp')}</option>
						<option value={"BRONZE"}>{t('key_1783109431586_jpgz')}</option>
						<option value={"SILVER"}>{t('key_1783109431594_kafm')}</option>
						<option value={"GOLD"}>{t('key_1783109431603_fqhn')}</option>
					</select>
				}
				emptyMessage={t('str_2YTYpyDY')}
				renderRow={(teacher) => {
					const badge = VERIFICATION_BADGES_CONFIG[teacher.verificationLevel];
					const badgeColorClass = badge.colorClass;

					return (
						<tr
							key={teacher.id}
							className="border-b border-border last:border-none hover:bg-accent/20"
						>
							<td className="p-4">
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-3">
										<div className="relative h-9 w-9 rounded-full overflow-hidden bg-accent border border-border flex-shrink-0">
											{teacher.profileImageUrl ? (
												<img
													src={teacher.profileImageUrl}
													alt={teacher.user.name}
													className="h-full w-full object-cover"
												/>
											) : (
												<div className="h-full w-full flex items-center justify-center text-primary font-bold text-sm bg-primary/10">
													{teacher.user.name.charAt(0)}
												</div>
											)}
										</div>
										<div>
											<span className="font-bold block text-foreground/80">
												{teacher.user.name}
											</span>
											<span className="text-[10px] text-primary">
												{teacher.specialization}
											</span>
										</div>
									</div>
									<button
										type="button"
										onClick={() => setSelectedTeacherId(teacher.id)}
										className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
										title={t('teachers_list_view_profile')}
									>
										<Eye className="h-4.5 w-4.5" />
									</button>
								</div>
							</td>
							<td className="p-4 text-muted-foreground">{teacher.user.email}</td>
							<td className="p-4">
								<div className="flex items-center gap-1.5">
									<Star className="h-4 w-4 text-yellow-500 fill-currentColor" />
									<span className="font-semibold">
										{Number(teacher.averageRating).toFixed(1)}
									</span>
									<span className="text-[10px] text-muted-foreground">
										({teacher.totalReviews})
									</span>
								</div>
							</td>
							<td className="p-4">
								<span
									className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColorClass}`}
								>
									{badge.label}
								</span>
							</td>
							<td className="p-4 text-end">
								{loadingId === teacher.id ? (
									<Loader2 className="h-4.5 w-4.5 animate-spin me-auto" />
								) : (
									<select
										value={teacher.verificationLevel}
										onChange={(e) =>
											handleLevelChange(
												teacher.id,
												e.target.value as VerificationLevel,
											)
										}
										className="premium-input text-xs w-36 cursor-pointer"
									>
										<option value={"NONE"}>{t('verification_level_none')}</option>
										<option value={"BRONZE"}>{t('verification_level_bronze')}</option>
										<option value={"SILVER"}>{t('verification_level_silver')}</option>
										<option value={"GOLD"}>{t('verification_level_gold')}</option>
									</select>
								)}
							</td>
						</tr>
					);
				}}
			/>
			<DetailsModal
				isOpen={!!selectedTeacherId}
				onClose={() => setSelectedTeacherId(null)}
				entityType="teacher"
				entityId={selectedTeacherId}
			/>
		</div>
	);
}
