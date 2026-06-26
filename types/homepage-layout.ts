export type SectionType =
	| "hero"
	| "stats"
	| "subjects"
	| "features"
	| "how_it_works"
	| "featured_teachers"
	| "testimonials"
	| "faq"
	| "cta"
	| "custom_html";

export interface Section {
	id: string;
	type: SectionType;
	enabled: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	props: Record<string, any>;
}

export const SECTION_TYPE_LABELS: Record<
	SectionType,
	{ label: string; desc: string }
> = {
	hero: {
		label: "القسم التعريفي الأول (Hero)",
		desc: "الواجهة الرئيسية وعنوان الترحيب مع شارة ترويجية وأزرار البحث والتسجيل.",
	},
	stats: {
		label: "شريط الإحصائيات (Stats Bar)",
		desc: "شريط الأرقام والعدادات التفاعلية (معلمين، طلاب، جلسات ناجحة).",
	},
	subjects: {
		label: "المواد الأكثر طلباً (Subjects Selector)",
		desc: "شارات للمواد الدراسية الشائعة لتسهيل البحث الفوري.",
	},
	features: {
		label: "مميزات المنصة (Features)",
		desc: "بطاقات توضيحية لخدمات ومميزات المنصة (الأمان، الجلسات المجانية، الدفع).",
	},
	how_it_works: {
		label: "كيف يعمل الموقع (How It Works)",
		desc: "خطوات حجز الجلسات وحضورها بالتفصيل للأهالي والطلاب.",
	},
	featured_teachers: {
		label: "معلمون مميزون (Featured Teachers)",
		desc: "جلب تلقائي لأكثر المعلمين تقييماً وتوثيقاً من قاعدة البيانات.",
	},
	testimonials: {
		label: "آراء أولياء الأمور (Testimonials)",
		desc: "آراء وتقييمات حقيقية من أهالي الطلاب المستفيدين.",
	},
	faq: {
		label: "الأسئلة الشائعة (FAQ Accordion)",
		desc: "أسئلة تفاعلية شائعة تسحب تلقائياً من قاعدة البيانات.",
	},
	cta: {
		label: "دعوة للتسجيل الفوري (CTA)",
		desc: "بانر تشجيعي سفلي يوجه الزوار للتسجيل الفوري كمعلم أو كأب.",
	},
	custom_html: {
		label: "قسم HTML مخصص (Custom HTML)",
		desc: "إضافة فيديو تعريفي أو كود HTML مخصص من قبل الأدمن.",
	},
};

export const AVAILABLE_ICONS = [
	"ShieldCheck",
	"CalendarCheck",
	"GraduationCap",
	"CreditCard",
	"Star",
	"FileText",
	"Sparkles",
	"BookOpen",
	"Heart",
	"Smile",
	"Trophy",
	"Users",
	"Video",
	"Clock",
	"Award",
];

export const DEFAULT_LAYOUT: Section[] = [
	{
		id: "hero",
		type: "hero",
		enabled: true,
		props: {
			badgeText: "جديد",
			badgeMessage: "جلستك التجريبية الأولى مجانية تماماً 🎉",
			headline: "ابحث عن معلمك المثالي في الضفة الغربية",
			subheadline:
				"منصة إديونست تربطك بمعلمين خصوصيين موثّقين لجميع المواد والمراحل الدراسية. حجز سهل، دفع آمن، ومتابعة مستمرة لتقدم طفلك.",
			primaryBtnText: "ابحث عن معلم",
			primaryBtnLink: "/teachers",
			secondaryBtnText: "سجّل كمعلم",
			secondaryBtnLink: "/register",
		},
	},
	{
		id: "stats",
		type: "stats",
		enabled: true,
		props: {
			items: [
				{ label: "معلم موثّق", value: 200, suffix: "+" },
				{ label: "جلسة ناجحة", value: 5000, suffix: "+" },
				{ label: "طالب مستفيد", value: 1200, suffix: "+" },
				{ label: "مدينة تغطيتها", value: 15, suffix: "+" },
			],
		},
	},
	{
		id: "subjects",
		type: "subjects",
		enabled: true,
		props: {
			title: "المواد الأكثر طلباً",
			subjects: [
				"رياضيات",
				"فيزياء",
				"كيمياء",
				"أحياء",
				"عربي",
				"إنجليزي",
				"تاريخ",
				"جغرافيا",
				"دين",
				"معلوماتية",
				"اقتصاد",
				"محاسبة",
			],
		},
	},
	{
		id: "features",
		type: "features",
		enabled: true,
		props: {
			title: "لماذا إديونست؟",
			subtitle:
				"صممنا المنصة لتوفر تجربة تعليمية موثوقة وممتعة ومنظمة للأهل والطلاب على حد سواء.",
			items: [
				{
					iconName: "ShieldCheck",
					title: "معلمون موثّقون",
					desc: "نتحقق من هوية كل معلم وشهاداته الأكاديمية قبل قبوله في المنصة.",
				},
				{
					iconName: "CalendarCheck",
					title: "حجز فوري وسهل",
					desc: "اختر المعلم المناسب واحجز جلستك في دقائق معدودة دون أي تعقيد.",
				},
				{
					iconName: "GraduationCap",
					title: "جلسة تجريبية مجانية",
					desc: "جرّب أول جلسة مجاناً مع كل معلم لتطمئن على أسلوبه قبل الالتزام.",
				},
				{
					iconName: "CreditCard",
					title: "دفع آمن ومحمي",
					desc: "نقبل التحويل البنكي والدفع الإلكتروني مع ضمان استرداد المبلغ عند الإلغاء.",
				},
				{
					iconName: "Star",
					title: "تقييمات حقيقية",
					desc: "اقرأ آراء الأهالي الحقيقية واختر المعلم الأعلى تقييماً في تخصصه.",
				},
				{
					iconName: "FileText",
					title: "تقارير الحصص",
					desc: "يرسل لك المعلم تقريراً بعد كل حصة يشمل المواضيع والأداء والواجبات.",
				},
			],
		},
	},
	{
		id: "how_it_works",
		type: "how_it_works",
		enabled: true,
		props: {
			title: "كيف يعمل إديونست؟",
			subtitle: "ثلاث خطوات بسيطة ويكون طفلك في أفضل أيدٍ أمينة",
			items: [
				{
					num: "١",
					title: "ابحث عن معلم",
					desc: "اكتب التخصص والمدينة واختر من قائمة المعلمين الموثّقين.",
				},
				{
					num: "٢",
					title: "احجز جلستك",
					desc: "اختر الوقت المناسب واحجز جلستك التجريبية المجانية فوراً.",
				},
				{
					num: "٣",
					title: "تعلّم وتقدّم",
					desc: "احضر حصتك واحصل على تقرير مفصّل بعد كل جلسة.",
				},
			],
		},
	},
	{
		id: "featured_teachers",
		type: "featured_teachers",
		enabled: true,
		props: {
			title: "معلمون مميزون",
			subtitle: "الأعلى تقييماً من قِبل أولياء الأمور",
			limit: 6,
		},
	},
	{
		id: "testimonials",
		type: "testimonials",
		enabled: true,
		props: {
			title: "ماذا يقول أولياء الأمور؟",
			subtitle: "تجارب حقيقية من عائلات استفادت من خدماتنا",
			items: [
				{
					text: "أفضل منصة للبحث عن معلمين. ابني تحسن في الرياضيات بشكل ملحوظ بعد 3 حصص فقط!",
					author: "أم أحمد",
					city: "رام الله",
				},
				{
					text: "سهولة في الحجز ومصداقية عالية. التقرير بعد كل جلسة يريحني جداً وأعرف أين وصل طفلي.",
					author: "أبو يوسف",
					city: "نابلس",
				},
				{
					text: "الأساتذة هنا محترفون جداً. الجلسة التجريبية فكرة رائعة ساعدتنا في اختيار المعلم الأنسب.",
					author: "أم سارة",
					city: "الخليل",
				},
			],
		},
	},
	{
		id: "faq",
		type: "faq",
		enabled: true,
		props: {
			title: "الأسئلة الشائعة",
			subtitle: "كل ما ترغب بمعرفته حول كيفية الحجز والتعامل مع المنصة",
		},
	},
	{
		id: "cta",
		type: "cta",
		enabled: true,
		props: {
			title: "ابدأ رحلة طفلك التعليمية اليوم",
			subtitle:
				"سجّل مجاناً، تصفح المعلمين، واحجز جلستك التجريبية دون أي التزام.",
			primaryBtnText: "🚀 سجّل الآن مجاناً",
			primaryBtnLink: "/register",
			secondaryBtnText: "تصفح المعلمين",
			secondaryBtnLink: "/teachers",
		},
	},
];
