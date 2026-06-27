
import { PrismaPg } from "@prisma/adapter-pg";
import {
	BookingSource,
	BookingStatus,
	PaymentMethod,
	PaymentStatus,
	PrismaClient,
	UserType,
	VerificationLevel,
	User,
	Student,
	Teacher,
	TeacherService,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Pool } from "pg";
import { SERVICES } from "../lib/translations";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("🌱 بدء إنشاء البيانات التجريبية الضخمة...");

	// 1. Settings
	const settings = [
		{
			settingKey: "DefaultCommissionRate",
			settingValue: "15",
			description: "نسبة العمولة الافتراضية (%)",
		},
		{
			settingKey: "QuickHelpCommissionRate",
			settingValue: "20",
			description: "عمولة شرح المسألة (%)",
		},
		{
			settingKey: "MonthlyPackageCommissionRate",
			settingValue: "12",
			description: "عمولة الحقيبة الشهرية (%)",
		},
		{
			settingKey: "FreeTrialEnabled",
			settingValue: "true",
			description: "الجلسة المجانية مفعلة",
		},
		{
			settingKey: "FreeTrialDurationMinutes",
			settingValue: "30",
			description: "30 دقيقة",
		},
		{
			settingKey: "FreeTrialCostToPlatform",
			settingValue: "0",
			description: "0 شيكل",
		},
		{
			settingKey: "MaxRefundRequests",
			settingValue: "2",
			description: "حد الاسترداد التلقائي",
		},
		{
			settingKey: "MinBookingPrice",
			settingValue: "5",
			description: "الحد الأدنى (شيكل)",
		},
		{
			settingKey: "CancellationRefundHours",
			settingValue: "24",
			description: "ساعات الإلغاء المجاني",
		},
		{
			settingKey: "MinBookingLeadHours",
			settingValue: "2",
			description: "حد أدنى بين الحجز والجلسة",
		},
	];

	for (const s of settings) {
		await prisma.systemSetting.upsert({
			where: { settingKey: s.settingKey },
			update: { settingValue: s.settingValue, description: s.description },
			create: s,
		});
	}
	console.log("✅ إعدادات النظام");

	// 2. Service Types
	const serviceTypes = [
		{
			name: SERVICES.FULL_SESSION,
			nameEnglish: "Full Session",
			defaultDuration: 60,
			commissionRate: 15,
			displayOrder: 1,
		},
		{
			name: SERVICES.QUICK_HELP,
			nameEnglish: "Quick Help",
			defaultDuration: 15,
			commissionRate: 20,
			displayOrder: 2,
		},
		{
			name: SERVICES.MEDIUM_SESSION,
			nameEnglish: "Medium Session",
			defaultDuration: 30,
			commissionRate: 15,
			displayOrder: 3,
		},
		{
			name: SERVICES.MONTHLY_PACKAGE,
			nameEnglish: "Monthly Package",
			defaultDuration: 480,
			commissionRate: 12,
			displayOrder: 4,
			isRecurring: true,
		},
	];

	for (const st of serviceTypes) {
		await prisma.serviceType.upsert({
			where: { name: st.name },
			update: {
				nameEnglish: st.nameEnglish,
				defaultDuration: st.defaultDuration,
				commissionRate: st.commissionRate,
				displayOrder: st.displayOrder,
				isRecurring: st.isRecurring ?? false,
			},
			create: st,
		});
	}
	console.log("✅ أنواع الخدمات");

	const fullSession = await prisma.serviceType.findUnique({
		where: { name: SERVICES.FULL_SESSION },
	});
	const quickHelp = await prisma.serviceType.findUnique({
		where: { name: SERVICES.QUICK_HELP },
	});

	if (!fullSession || !quickHelp) throw new Error("Service types missing");

	const defaultPassword = await bcrypt.hash("Test@123456", 12);

	// 3. Admin
	const adminEmail = "admin@edunest.ps";
	let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
	if (!admin) {
		admin = await prisma.user.create({
			data: {
				name: "مدير النظام",
				email: adminEmail,
				passwordHash: defaultPassword,
				userType: UserType.ADMIN,
			},
		});
	}
	console.log("✅ تم إنشاء/تحديث الأدمن");

	// 4. Parents & Students
	const parentsData = [
		{
			name: "أبو أحمد",
			email: "parent1@test.com",
			phone: "0599111111",
			students: [
				{ name: "أحمد", grade: 10 },
				{ name: "سارة", grade: 6 },
			],
		},
		{
			name: "أم محمد",
			email: "parent2@test.com",
			phone: "0599222222",
			students: [{ name: "محمد", grade: 12 }],
		},
		{
			name: "أبو يوسف",
			email: "parent3@test.com",
			phone: "0599333333",
			students: [
				{ name: "يوسف", grade: 5 },
				{ name: "ليان", grade: 8 },
				{ name: "عمر", grade: 9 },
			],
		},
	];

	const parentUsers: (User & { students: Student[] })[] = [];
	const allStudents: Student[] = [];

	for (const p of parentsData) {
		let parent = await prisma.user.findUnique({ where: { email: p.email } });
		if (!parent) {
			parent = await prisma.user.create({
				data: {
					name: p.name,
					email: p.email,
					phone: p.phone,
					passwordHash: defaultPassword,
					userType: UserType.PARENT,
					students: {
						create: p.students,
					},
				},
				include: { students: true },
			});
		} else {
			parent = await prisma.user.findUnique({
				where: { email: p.email },
				include: { students: true },
			});
		}
		const parentObj = parent as User & { students: Student[] };
		parentUsers.push(parentObj);
		allStudents.push(...(parentObj.students || []));
	}
	console.log("✅ تم إنشاء 3 أولياء أمور و 6 طلاب");

	// 5. Teachers
	const teachersData = [
		{
			name: "أستاذ خالد",
			email: "khaled@test.com",
			spec: "رياضيات",
			subSpec: "التوجيهي العلمي",
			city: "رام الله",
			levels: [10, 11, 12],
			rate: 60,
			level: VerificationLevel.GOLD,
			bio: "مدرس رياضيات بخبرة 15 عاماً في تدريس التوجيهي.",
		},
		{
			name: "معلمة منى",
			email: "mona@test.com",
			spec: "رياضيات",
			subSpec: "المرحلة الأساسية",
			city: "نابلس",
			levels: [5, 6, 7, 8, 9],
			rate: 45,
			level: VerificationLevel.SILVER,
			bio: "مختصة في تأسيس الطلاب في مادة الرياضيات.",
		},
		{
			name: "أستاذ سامي",
			email: "sami@test.com",
			spec: "فيزياء",
			subSpec: "فيزياء توجيهي",
			city: "الخليل",
			levels: [11, 12],
			rate: 70,
			level: VerificationLevel.GOLD,
			bio: "أقوم بتبسيط الفيزياء المعقدة بطرق مبتكرة.",
		},
		{
			name: "معلمة ليلى",
			email: "layla@test.com",
			spec: "لغة إنجليزية",
			subSpec: "محادثة وتأسيس",
			city: "رام الله",
			levels: [1, 2, 3, 4, 5, 6, 7, 8],
			rate: 40,
			level: VerificationLevel.BRONZE,
			bio: "مدرسة لغة إنجليزية وأسعى لكسر حاجز الخوف من التحدث.",
		},
		{
			name: "أستاذ عمر",
			email: "omar@test.com",
			spec: "لغة عربية",
			subSpec: "نحو وصرف",
			city: "جنين",
			levels: [8, 9, 10, 11, 12],
			rate: 50,
			level: VerificationLevel.SILVER,
			bio: "عاشق للغة الضاد، أعلم النحو بأسلوب عصري.",
		},
	];

	const teacherObjects: Teacher[] = [];
	const teacherServices: TeacherService[] = [];

	for (const t of teachersData) {
		let tUser = await prisma.user.findUnique({ where: { email: t.email } });
		if (!tUser) {
			tUser = await prisma.user.create({
				data: {
					name: t.name,
					email: t.email,
					passwordHash: defaultPassword,
					userType: UserType.TEACHER,
					phoneVerified: true,
				},
			});
			const slugSuffix = crypto.randomBytes(3).toString("hex");
			const teacher = await prisma.teacher.create({
				data: {
					userId: tUser.id,
					subSpecialization: t.subSpec,
					slug: `${t.name.split(" ")[1]}-${t.spec}-${slugSuffix}`.replace(
						/ /g,
						"-",
					),
					city: t.city,
					gradeLevels: t.levels,
					defaultHourlyRate: t.rate,
					yearsOfExperience: Math.floor(Math.random() * 10) + 3,
					bio: t.bio,
					isVerified: true,
					verificationLevel: t.level,
				},
			});
			teacherObjects.push(teacher);

			// Add Services
			const ts1 = await prisma.teacherService.create({
				data: {
					teacherId: teacher.id,
					serviceTypeId: fullSession.id,
					price: t.rate,
					duration: 60,
				},
			});
			teacherServices.push(ts1);

			if (Math.random() > 0.5) {
				await prisma.teacherService.create({
					data: {
						teacherId: teacher.id,
						serviceTypeId: quickHelp.id,
						price: t.rate * 0.4,
						duration: 15,
					},
				});
			}

			// Availability (Mon-Thu, 4pm to 8pm)
			for (let day = 1; day <= 4; day++) {
				await prisma.teacherAvailability.create({
					data: {
						teacherId: teacher.id,
						dayOfWeek: day,
						startTime: "16:00",
						endTime: "20:00",
					},
				});
			}
		} else {
			const teacher = await prisma.teacher.findUnique({
				where: { userId: tUser.id },
			});
			if (teacher) {
				teacherObjects.push(teacher);
				const tss = await prisma.teacherService.findMany({
					where: { teacherId: teacher.id },
				});
				teacherServices.push(...tss);
			}
		}
	}
	console.log("✅ تم إنشاء 5 معلمين (تخصصات متعددة وخبرات مختلفة)");

	// 6. Bookings (Diverse statuses)
	// We will create 15 bookings
	console.log("⏳ جاري إنشاء الحجوزات والمدفوعات...");
	const now = new Date();

	const bookingScenarios = [
		{
			status: BookingStatus.COMPLETED,
			paymentStatus: PaymentStatus.PAID,
			daysOffset: -5,
			withReport: true,
			withReview: true,
		},
		{
			status: BookingStatus.COMPLETED,
			paymentStatus: PaymentStatus.PAID,
			daysOffset: -3,
			withReport: true,
			withReview: false,
		},
		{
			status: BookingStatus.CONFIRMED,
			paymentStatus: PaymentStatus.PAID,
			daysOffset: 1,
			withReport: false,
			withReview: false,
		},
		{
			status: BookingStatus.CONFIRMED,
			paymentStatus: PaymentStatus.PAID,
			daysOffset: 2,
			withReport: false,
			withReview: false,
		},
		{
			status: BookingStatus.PENDING,
			paymentStatus: PaymentStatus.UNPAID,
			daysOffset: 3,
			withReport: false,
			withReview: false,
		},
		{
			status: BookingStatus.PENDING,
			paymentStatus: PaymentStatus.UNPAID,
			daysOffset: 4,
			withReport: false,
			withReview: false,
		},
		{
			status: BookingStatus.REJECTED,
			paymentStatus: PaymentStatus.REFUNDED,
			daysOffset: -1,
			withReport: false,
			withReview: false,
		},
		{
			status: BookingStatus.CANCELLED,
			paymentStatus: PaymentStatus.REFUNDED,
			daysOffset: -2,
			withReport: false,
			withReview: false,
		},
	];

	let bookingCounter = 0;
	for (let i = 0; i < 15; i++) {
		const scenario = bookingScenarios[i % bookingScenarios.length];
		const teacherSvc =
			teacherServices[Math.floor(Math.random() * teacherServices.length)];
		const parent = parentUsers[Math.floor(Math.random() * parentUsers.length)];
		const student =
			parent.students[Math.floor(Math.random() * parent.students.length)];

		const startTime = new Date(now);
		startTime.setDate(now.getDate() + scenario.daysOffset);
		startTime.setHours(16 + Math.floor(Math.random() * 4), 0, 0, 0);

		const booking = await prisma.booking.create({
			data: {
				parentUserId: parent.id,
				studentId: student.id,
				teacherServiceId: teacherSvc.id,
				startTime: startTime,
				duration: teacherSvc.duration,
				price: teacherSvc.price,
				appliedCommissionRate: 15,
				status: scenario.status,
				paymentStatus: scenario.paymentStatus,
				bookingSource: BookingSource.WEB,
				parentNotes: "ابني ضعيف في الأساسيات، يرجى التركيز عليها.",
				meetingUrl: ([BookingStatus.CONFIRMED, BookingStatus.COMPLETED] as BookingStatus[]).includes(
					scenario.status,
				)
					? "https://meet.jit.si/edunest-test-meeting"
					: null,
				confirmedAt: ([
					BookingStatus.CONFIRMED,
					BookingStatus.COMPLETED,
				] as BookingStatus[]).includes(scenario.status)
					? new Date()
					: null,
				completedAt:
					scenario.status === BookingStatus.COMPLETED ? new Date() : null,
				cancelledAt:
					scenario.status === BookingStatus.CANCELLED ? new Date() : null,
				cancellationReason:
					scenario.status === BookingStatus.CANCELLED ? "ظرف طارئ" : null,
			},
		});

		if (scenario.paymentStatus !== PaymentStatus.UNPAID) {
			await prisma.payment.create({
				data: {
					bookingId: booking.id,
					amount: teacherSvc.price,
					method: PaymentMethod.ONLINE_CARD,
					isPaid: scenario.paymentStatus === PaymentStatus.PAID,
					paidAt:
						scenario.paymentStatus === PaymentStatus.PAID ? new Date() : null,
				},
			});
		}

		if (scenario.withReport && scenario.status === BookingStatus.COMPLETED) {
			await prisma.sessionReport.create({
				data: {
					bookingId: booking.id,
					studentAttended: true,
					topicsCovered: "مراجعة الوحدة الأولى وحل تمارين الكتاب",
					studentPerformance: 4,
					homeworkAssigned: "حل التمارين من صفحة 20 إلى 25",
					teacherNotes: "الطالب متجاوب وذكي، يحتاج فقط للتدريب المستمر.",
				},
			});
		}

		if (scenario.withReview && scenario.status === BookingStatus.COMPLETED) {
			const tId = teacherObjects.find((t) => t.id === teacherSvc.teacherId)?.id;
			if (tId) {
				await prisma.review.create({
					data: {
						bookingId: booking.id,
						teacherId: tId,
						rating: 5,
						comment: "معلم ممتاز وطريقة شرحه رائعة جداً، ابني استفاد كثيراً.",
					},
				});
			}
		}

		// Notifications
		await prisma.notification.create({
			data: {
				userId: parent.id,
				title: `تحديث لحالة حجزك`,
				message: `حجزك مع المعلم بتاريخ ${startTime.toLocaleDateString()} أصبح الآن ${scenario.status}.`,
			},
		});

		bookingCounter++;
	}
	console.log(
		`✅ تم إنشاء ${bookingCounter} حجز بحالات مختلفة (مع التقارير، التقييمات والمدفوعات)`,
	);

	console.log("🎉 اكتملت عملية التعبئة بنجاح!");
	console.log("\n--- الحسابات التجريبية (كلمة المرور للجميع: Test@123456) ---");
	console.log("🔹 الأدمن: admin@edunest.ps");
	for (const p of parentsData)
		console.log(`🔹 ولي أمر (${p.name}): ${p.email}`);
	for (const t of teachersData) console.log(`🔹 معلم (${t.name}): ${t.email}`);
}

main()
	.catch((e) => {
		console.error("❌ خطأ في الـ seed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
