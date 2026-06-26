export type Student = {
	id: string;
	name: string;
	grade: number;
};

export type AvailableTeacher = {
	id: string;
	userId: string;
	slug: string;
	userName: string;
	specialization: string;
	city: string | null;
	profileImageUrl: string | null;
	verificationLevel: string;
	averageRating: number;
	totalReviews: number;
	totalSessions: number;
	yearsOfExperience: number;
	education: string | null;
	bio: string | null;
	services: {
		id: string;
		price: number;
		duration: number;
		serviceTypeName: string;
		serviceTypeNameEnglish: string | null;
	}[];
};
