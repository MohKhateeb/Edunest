import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
	BookingSource,
	BookingStatus,
	PaymentMethod,
	PaymentStatus,
	PrismaClient,
	UserType,
	VerificationLevel,
	DisputeStatus,
	DisputeTurn,
	EscrowResolution,
	RequestStatus,
	FAQCategory,
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

function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
	return arr[randomInt(0, arr.length - 1)];
}

function randomDate(startDays: number, endDays: number) {
	const date = new Date();
	date.setDate(date.getDate() + randomInt(startDays, endDays));
	date.setHours(randomInt(8, 22), 0, 0, 0);
	return date;
}

async function main() {
	console.log("🌱 بدء إنشاء البيانات التجريبية الضخمة (النسخة الموسعة)...");

	// 1. Settings
	const settings = [
		{ settingKey: "DefaultCommissionRate", settingValue: "15" },
		{ settingKey: "QuickHelpCommissionRate", settingValue: "20" },
		{ settingKey: "MonthlyPackageCommissionRate", settingValue: "12" },
		{ settingKey: "FreeTrialEnabled", settingValue: "true" },
		{ settingKey: "FreeTrialDurationMinutes", settingValue: "30" },
		{ settingKey: "FreeTrialCostToPlatform", settingValue: "0" },
		{ settingKey: "MaxRefundRequests", settingValue: "2" },
		{ settingKey: "MinBookingPrice", settingValue: "5" },
		{ settingKey: "CancellationRefundHours", settingValue: "24" },
		{ settingKey: "MinBookingLeadHours", settingValue: "2" },
		{ settingKey: "PAYMENT_HOLD_MINUTES", settingValue: "180", description: "المدة التي يُمهل فيها ولي الأمر لإتمام الدفع بعد موافقة المعلم. القيمة الافتراضية: 180 دقيقة (3 ساعات)" },
	];

	for (const s of settings) {
		await prisma.systemSetting.upsert({
			where: { settingKey: s.settingKey },
			update: { settingValue: s.settingValue },
			create: s,
		});
	}
	console.log("✅ إعدادات النظام");

	// 2. Services
	const serviceTypesData = [
		{ name: SERVICES.FULL_SESSION, defaultDuration: 60, commissionRate: 15, isRecurring: false },
		{ name: SERVICES.QUICK_HELP, defaultDuration: 15, commissionRate: 20, isRecurring: false },
		{ name: SERVICES.MONTHLY_PACKAGE, defaultDuration: 480, commissionRate: 12, isRecurring: true },
	];

	for (const st of serviceTypesData) {
		await prisma.serviceType.upsert({
			where: { name: st.name },
			update: { defaultDuration: st.defaultDuration, commissionRate: st.commissionRate, isRecurring: st.isRecurring },
			create: st,
		});
	}
	
	const fullSession = await prisma.serviceType.findUnique({ where: { name: SERVICES.FULL_SESSION } });
	const quickHelp = await prisma.serviceType.findUnique({ where: { name: SERVICES.QUICK_HELP } });
	if (!fullSession || !quickHelp) throw new Error("Service types missing");

	// 3. Subjects
	const subjectNames = ["رياضيات", "فيزياء", "كيمياء", "أحياء", "لغة عربية", "لغة إنجليزية", "تاريخ", "برمجة", "علوم", "جغرافيا"];
	for (const name of subjectNames) {
		await prisma.subject.upsert({
			where: { name },
			update: {},
			create: { name, isActive: true },
		});
	}
	const subjects = await prisma.subject.findMany();

	const defaultPassword = await bcrypt.hash("Test@123456", 12);

	// 4. Admin
	const adminEmail = "admin@edunest.ps";
	let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
	if (!admin) {
		admin = await prisma.user.create({
			data: { name: "مدير النظام", email: adminEmail, passwordHash: defaultPassword, userType: UserType.ADMIN },
		});
	}

	// 5. Parents and Students (50 Parents, ~120 Students)
	console.log("⏳ جاري إنشاء 50 ولي أمر مع طلابهم...");
	const parentFirstNames = ["أحمد", "محمد", "خالد", "عمر", "طارق", "سعيد", "فاطمة", "مريم", "سارة", "ليلى", "هدى", "منى"];
	const parentLastNames = ["الخطيب", "المصري", "النجار", "حداد", "عوض", "منصور", "شاهين", "عودة", "سالم", "حسن"];
	const studentNamesList = ["يوسف", "علي", "محمود", "ليان", "نور", "رؤى", "رامي", "سامي", "زيد", "هبة", "جنى", "كريم", "تالا"];

	const parentUsers = [];
	const allStudents = [];

	for (let i = 1; i <= 50; i++) {
		const numStudents = randomInt(1, 4);
		const studentsToCreate = [];
		for (let j = 0; j < numStudents; j++) {
			studentsToCreate.push({
				name: randomItem(studentNamesList) + " " + i,
				grade: randomInt(1, 12),
			});
		}

		const pUser = await prisma.user.create({
			data: {
				name: `${randomItem(parentFirstNames)} ${randomItem(parentLastNames)}`,
				email: `parent${i}@test.com`,
				phone: `0599${String(i).padStart(6, "0")}`,
				passwordHash: defaultPassword,
				userType: UserType.PARENT,
				students: { create: studentsToCreate },
			},
			include: { students: true },
		});
		parentUsers.push(pUser);
		allStudents.push(...pUser.students);
	}
	console.log(`✅ تم إنشاء 50 ولي أمر و ${allStudents.length} طالب`);

	// 6. Teachers (30 Teachers)
	console.log("⏳ جاري إنشاء 30 معلم وتخصصاتهم وخدماتهم...");
	const cities = ["رام الله", "نابلس", "جنين", "الخليل", "بيت لحم", "طولكرم", "غزة", "القدس"];
	const teacherUsers = [];
	const teacherObjects = [];
	const teacherServices = [];

	for (let i = 1; i <= 30; i++) {
		const subject = randomItem(subjects);
		const tUser = await prisma.user.create({
			data: {
				name: `أستاذ ${randomItem(parentFirstNames)} ${i}`,
				email: `teacher${i}@test.com`,
				phone: `0566${String(i).padStart(6, "0")}`,
				passwordHash: defaultPassword,
				userType: UserType.TEACHER,
				phoneVerified: true,
			},
		});
		teacherUsers.push(tUser);

		const slugSuffix = crypto.randomBytes(3).toString("hex");
		const levels = Array.from({length: randomInt(3, 8)}, () => randomInt(5, 12));
		
		const rate = randomInt(40, 150);
		const teacher = await prisma.teacher.create({
			data: {
				userId: tUser.id,
				slug: `teacher-${i}-${slugSuffix}`,
				city: randomItem(cities),
				gradeLevels: [...new Set(levels)],
				defaultHourlyRate: rate,
				yearsOfExperience: randomInt(1, 20),
				isVerified: true,
				verificationLevel: randomItem([VerificationLevel.NONE, VerificationLevel.BRONZE, VerificationLevel.SILVER, VerificationLevel.GOLD]),
				subjects: { create: { subjectId: subject.id } }
			},
		});
		teacherObjects.push(teacher);

		// Full Session
		const ts1 = await prisma.teacherService.create({
			data: { teacherId: teacher.id, serviceTypeId: fullSession.id, price: rate, duration: 60 },
		});
		teacherServices.push(ts1);

		// Quick Help
		if (randomInt(0, 1) === 1) {
			const ts2 = await prisma.teacherService.create({
				data: { teacherId: teacher.id, serviceTypeId: quickHelp.id, price: rate * 0.4, duration: 15 },
			});
			teacherServices.push(ts2);
		}

		// Availability
		for (let day = 1; day <= 5; day++) {
			await prisma.teacherAvailability.create({
				data: { teacherId: teacher.id, dayOfWeek: day, startTime: "14:00", endTime: "22:00" },
			});
		}
	}
	console.log(`✅ تم إنشاء 30 معلم`);

	// 7. Bookings (500 Diverse Bookings)
	console.log("⏳ جاري إنشاء 500 جلسة متنوعة...");
	
	const bookingStatuses = [
		{ s: BookingStatus.COMPLETED, p: PaymentStatus.PAID, weight: 60 },
		{ s: BookingStatus.CONFIRMED, p: PaymentStatus.PAID, weight: 15 },
		{ s: BookingStatus.PENDING, p: PaymentStatus.UNPAID, weight: 10 },
		{ s: BookingStatus.CANCELLED, p: PaymentStatus.REFUNDED, weight: 10 },
		{ s: BookingStatus.REJECTED, p: PaymentStatus.REFUNDED, weight: 5 },
	];

	function getWeightedStatus() {
		const totalWeight = bookingStatuses.reduce((acc, curr) => acc + curr.weight, 0);
		const random = randomInt(1, totalWeight);
		let sum = 0;
		for (const bs of bookingStatuses) {
			sum += bs.weight;
			if (random <= sum) return bs;
		}
		return bookingStatuses[0];
	}

	const createdBookings = [];

	for (let i = 1; i <= 500; i++) {
		const statusObj = getWeightedStatus();
		const ts = randomItem(teacherServices);
		const parent = randomItem(parentUsers);
		const student = randomItem(parent.students);
		
		let daysOffset = 0;
		if (statusObj.s === BookingStatus.COMPLETED) daysOffset = randomInt(-60, -1);
		else if (statusObj.s === BookingStatus.CONFIRMED) daysOffset = randomInt(1, 14);
		else if (statusObj.s === BookingStatus.PENDING) daysOffset = randomInt(2, 20);
		else daysOffset = randomInt(-30, 10);

		const startTime = randomDate(daysOffset, daysOffset);

		const booking = await prisma.booking.create({
			data: {
				parentUserId: parent.id,
				studentId: student.id,
				teacherServiceId: ts.id,
				startTime,
				duration: ts.duration,
				price: ts.price,
				appliedCommissionRate: 15,
				status: statusObj.s,
				paymentStatus: statusObj.p,
				createdAt: randomDate(daysOffset - 5, daysOffset - 1),
				completedAt: statusObj.s === BookingStatus.COMPLETED ? randomDate(daysOffset, daysOffset) : null,
			}
		});
		createdBookings.push(booking);

		if (statusObj.p !== PaymentStatus.UNPAID) {
			await prisma.payment.create({
				data: { bookingId: booking.id, amount: ts.price, isPaid: statusObj.p === PaymentStatus.PAID, paidAt: new Date() }
			});
		}

		if (statusObj.s === BookingStatus.COMPLETED && randomInt(1, 10) > 2) {
			await prisma.sessionReport.create({
				data: { bookingId: booking.id, studentAttended: true, topicsCovered: "تغطية ممتازة للدرس", studentPerformance: randomInt(3, 5) }
			});
			await prisma.review.create({
				data: { bookingId: booking.id, teacherId: ts.teacherId, rating: randomInt(4, 5), comment: "معلم رائع" }
			});
		}

		// Disputes (2% of completed/confirmed)
		if ((statusObj.s === BookingStatus.COMPLETED || statusObj.s === BookingStatus.CONFIRMED) && randomInt(1, 100) <= 2) {
			const teacherObj = teacherObjects.find(t => t.id === ts.teacherId);
			if (teacherObj) {
				await prisma.dispute.create({
					data: {
						bookingId: booking.id,
						parentUserId: parent.id,
						reason: "تأخر المعلم عن الموعد",
						status: randomItem([DisputeStatus.OPEN, DisputeStatus.RESOLVED_IN_FAVOR_OF_PARENT]),
						messages: {
							create: [
								{ senderId: parent.id, message: "المعلم لم يحضر!" },
								{ senderId: teacherObj.userId, message: "لقد كنت موجوداً وحصلت مشكلة بالانترنت" }
							]
						}
					}
				});
			}
		}

		// Escrow (1% of bookings)
		if (statusObj.s === BookingStatus.COMPLETED && randomInt(1, 100) <= 1) {
			await prisma.adminEscrow.create({
				data: {
					bookingId: booking.id,
					amount: ts.price,
					reason: "تحقيق في جودة الجلسة بناء على طلب ولي الأمر",
					status: randomItem([EscrowResolution.PENDING, EscrowResolution.REFUNDED_TO_PARENT])
				}
			});
		}
	}
	console.log(`✅ تم إنشاء 500 حجز متنوع (مع تقارير وتقييمات ونزاعات وإسكرو)`);

	// 8. Tutoring Requests (Live Radar)
	console.log("⏳ جاري إنشاء طلبات الفزعة...");
	for (let i = 0; i < 30; i++) {
		const parent = randomItem(parentUsers);
		const student = randomItem(parent.students);
		await prisma.tutoringRequest.create({
			data: {
				parentId: parent.id,
				studentId: student.id,
				subjectId: randomItem(subjects).id,
				serviceTypeId: quickHelp.id,
				title: "طلب مساعدة في مسألة صعبة جداً",
				details: "احتاج معلم يحل معي هذه المسألة غداً",
				startTime: randomDate(1, 5),
				duration: 15,
				price: randomInt(20, 50),
				status: randomItem([RequestStatus.PENDING, RequestStatus.ACCEPTED, RequestStatus.EXPIRED])
			}
		});
	}
	console.log(`✅ تم إنشاء 30 طلب فزعة`);

	// Update Teacher Aggregates manually
	console.log("⏳ تحديث تقييمات المعلمين...");
	for (const t of teacherObjects) {
		const agg = await prisma.review.aggregate({
			where: { teacherId: t.id, isVisible: true },
			_avg: { rating: true },
			_count: { id: true },
		});
		await prisma.teacher.update({
			where: { id: t.id },
			data: {
				averageRating: agg._avg.rating || 0,
				totalReviews: agg._count.id || 0,
				totalSessions: await prisma.booking.count({ where: { teacherService: { teacherId: t.id }, status: BookingStatus.COMPLETED } })
			}
		});
	}

	console.log("🎉 اكتملت عملية التعبئة بنجاح المطلق!");
}

main()
	.catch((e) => {
		console.error("❌ خطأ في الـ seed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
