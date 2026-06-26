import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { type NextRequest, NextResponse } from "next/server";
import path from "path";
import { auth } from "@/lib/auth";

function validateUploadRequest(file: File | null, bucketParam: string | null, userType: string): NextResponse | null {
	if (!file) {
		return NextResponse.json({ error: "لم يتم إرسال أي ملف" }, { status: 400 });
	}

	const MAX_FILE_SIZE = 50 * 1024 * 1024;
	if (file.size > MAX_FILE_SIZE) {
		return NextResponse.json({ error: "حجم الملف يتجاوز الحد الأقصى المسموح به (50MB)" }, { status: 400 });
	}

	const ALLOWED_TYPES = [
		"image/jpeg", "image/png", "image/webp", "application/pdf",
		"video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/3gpp",
	];
	if (!ALLOWED_TYPES.includes(file.type)) {
		return NextResponse.json(
			{ error: "نوع الملف غير مسموح به. مسموح بالصور، ملفات PDF، ومقاطع الفيديو الشائعة" },
			{ status: 400 }
		);
	}

	const ALLOWED_BUCKETS = ["verifications", "payment-proofs", "profiles", "uploads"];
	if (bucketParam && !ALLOWED_BUCKETS.includes(bucketParam)) {
		return NextResponse.json({ error: "مجلد الرفع غير صالح" }, { status: 400 });
	}

	const bucket = bucketParam || "uploads";
	if (bucket === "verifications" && userType === "PARENT") {
		return NextResponse.json({ error: "غير مصرح لك برفع ملفات توثيق" }, { status: 403 });
	}

	const fileExt = file.name.split(".").pop() || "";
	const safeExt = fileExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
	const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf", "mp4", "webm", "ogg", "mov", "3gp"];
	if (!ALLOWED_EXTENSIONS.includes(safeExt)) {
		return NextResponse.json({ error: "امتداد الملف غير مسموح به" }, { status: 400 });
	}

	return null;
}

async function uploadToSupabaseFallback(
	fileUrl: string, 
	uploadSuccess: boolean, 
	session: any, 
	bucket: string, 
	safeExt: string, 
	buffer: Buffer
): Promise<{ uploadSuccess: boolean; fileUrl: string; error?: NextResponse }> {
	if (!uploadSuccess) {
		if (!/^[a-zA-Z0-9-]+$/.test(session.user.id)) {
			return { uploadSuccess, fileUrl, error: NextResponse.json({ error: "معرف مستخدم غير صالح" }, { status: 400 }) };
		}

		const uploadDir = path.resolve(process.cwd(), "public", "uploads", bucket, session.user.id);
		const baseUploadsDir = path.resolve(process.cwd(), "public", "uploads");
		
		if (!uploadDir.startsWith(baseUploadsDir)) {
			return { uploadSuccess, fileUrl, error: NextResponse.json({ error: "مسار رفع غير صالح" }, { status: 400 }) };
		}

		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		const localFileName = `${Date.now()}.${safeExt}`;
		const filepath = path.join(uploadDir, localFileName);
		fs.writeFileSync(filepath, buffer);

		return { uploadSuccess: true, fileUrl: `/uploads/${bucket}/${session.user.id}/${localFileName}` };
	}
	return { uploadSuccess, fileUrl };
}

export async function POST(req: NextRequest) {
	try {
		// 1. حماية المسار: التحقق من تسجيل الدخول
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "غير مصرح لك برفع ملفات" }, { status: 401 });
		}

		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		const bucketParam = formData.get("bucket") as string | null;

		// 2, 3, 4. التحقق من صحة الطلب 
		const validationError = validateUploadRequest(file, bucketParam, session.user.userType || "");
		if (validationError) return validationError;

		const bucket = bucketParam || "uploads";
		const fileExt = file!.name.split(".").pop() || "";
		const safeExt = fileExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
		const fileName = `${session.user.id}/${Date.now()}.${safeExt}`;

		const bytes = await file!.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// 5. التحقق مما إذا كانت إعدادات Supabase مهيأة
		const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
		const isRealSupabase = sbUrl && !sbUrl.includes("your-project-ref") && sbKey && !sbKey.includes("your-service-role");

		let uploadSuccess = false;
		let fileUrl = "";

		if (isRealSupabase) {
			try {
				const supabase = createClient(sbUrl!, sbKey!);
				const { data, error } = await supabase.storage
					.from(bucket)
					.upload(fileName, buffer, { contentType: file!.type, upsert: false });

				if (error) {
					console.warn("Supabase storage upload error, falling back to local storage:", error);
				} else {
					const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
					fileUrl = publicUrlData.publicUrl;
					uploadSuccess = true;
				}
			} catch (sbErr) {
				console.warn("Supabase upload exception, falling back to local storage:", sbErr);
			}
		}

		// 6. الحفظ المحلي الاحتياطي (Fallback)
		const fallbackResult = await uploadToSupabaseFallback(fileUrl, uploadSuccess, session, bucket, safeExt, buffer);
		if (fallbackResult.error) return fallbackResult.error;

		return NextResponse.json({ success: true, url: fallbackResult.fileUrl });
	} catch (err: unknown) {
		console.error("Upload API error:", err);
		return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء الرفع" }, { status: 500 });
	}
}
