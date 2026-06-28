import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { type NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import path from "path";
import { auth } from "@/lib/auth";

async function validateUploadRequest(
	req: NextRequest,
	session: Session | null,
): Promise<{
	file?: File;
	bucket?: string;
	safeExt?: string;
	fileName?: string;
	error?: NextResponse;
}> {
	if (!session?.user?.id) {
		return {
			error: NextResponse.json(
				{ error: "غير مصرح لك برفع ملفات" },
				{ status: 401 },
			),
		};
	}

	const formData = await req.formData();
	const file = formData.get("file") as File | null;
	const bucketParam = formData.get("bucket") as string | null;

	if (!file) {
		return {
			error: NextResponse.json({ error: "لم يتم إرسال أي ملف" }, { status: 400 }),
		};
	}

	const MAX_FILE_SIZE = 50 * 1024 * 1024;
	if (file.size > MAX_FILE_SIZE) {
		return {
			error: NextResponse.json(
				{ error: "حجم الملف يتجاوز الحد الأقصى المسموح به (50MB)" },
				{ status: 400 },
			),
		};
	}

	const ALLOWED_TYPES = [
		"image/jpeg",
		"image/png",
		"image/webp",
		"application/pdf",
		"video/mp4",
		"video/webm",
		"video/ogg",
		"video/quicktime",
		"video/3gpp",
	];
	if (!ALLOWED_TYPES.includes(file.type)) {
		return {
			error: NextResponse.json(
				{ error: "نوع الملف غير مسموح به. مسموح بالصور، ملفات PDF، ومقاطع الفيديو الشائعة" },
				{ status: 400 },
			),
		};
	}

	const ALLOWED_BUCKETS = ["verifications", "payment-proofs", "profiles", "uploads"];
	if (bucketParam && !ALLOWED_BUCKETS.includes(bucketParam)) {
		return {
			error: NextResponse.json({ error: "مجلد الرفع غير صالح" }, { status: 400 }),
		};
	}

	const bucket = bucketParam || "uploads";
	const userType = session.user.userType || "";

	if (bucket === "verifications" && userType === "PARENT") {
		return {
			error: NextResponse.json(
				{ error: "غير مصرح لك برفع ملفات توثيق" },
				{ status: 403 },
			),
		};
	}

	const fileExt = file.name.split(".").pop() || "";
	const safeExt = fileExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
	const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf", "mp4", "webm", "ogg", "mov", "3gp"];

	if (!ALLOWED_EXTENSIONS.includes(safeExt)) {
		return {
			error: NextResponse.json({ error: "امتداد الملف غير مسموح به" }, { status: 400 }),
		};
	}

	const fileName = `${session.user.id}/${Date.now()}.${safeExt}`;

	return { file, bucket, safeExt, fileName };
}

async function uploadToSupabase(
	buffer: Buffer,
	fileName: string,
	mimeType: string,
	bucket: string,
): Promise<{ url?: string; error?: unknown }> {
	const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	const isRealSupabase =
		sbUrl &&
		!sbUrl.includes("your-project-ref") &&
		sbKey &&
		!sbKey.includes("your-service-role");

	if (!isRealSupabase) return { error: new Error("Supabase is not configured properly") };

	try {
		const supabase = createClient(sbUrl!, sbKey!);
		const { data, error } = await supabase.storage
			.from(bucket)
			.upload(fileName, buffer, { contentType: mimeType, upsert: false });

		if (error) {
			console.warn("Supabase storage upload error:", error);
			return { error };
		}

		const { data: publicUrlData } = supabase.storage
			.from(bucket)
			.getPublicUrl(data.path);
			
		return { url: publicUrlData.publicUrl };
	} catch (err) {
		console.warn("Supabase upload exception:", err);
		return { error: err };
	}
}

async function uploadToLocalStorage(
	buffer: Buffer,
	fileName: string,
	bucket: string,
): Promise<{ url?: string; error?: NextResponse }> {
	const parts = fileName.split("/");
	if (parts.length !== 2) {
		return {
			error: NextResponse.json({ error: "مسار رفع غير صالح" }, { status: 400 }),
		};
	}
	const [userId, localFileName] = parts;

	if (!/^[a-zA-Z0-9-]+$/.test(userId)) {
		return {
			error: NextResponse.json({ error: "معرف مستخدم غير صالح" }, { status: 400 }),
		};
	}

	const uploadDir = path.resolve(process.cwd(), "public", "uploads", bucket, userId);
	const baseUploadsDir = path.resolve(process.cwd(), "public", "uploads");

	if (!uploadDir.startsWith(baseUploadsDir)) {
		return {
			error: NextResponse.json({ error: "مسار رفع غير صالح" }, { status: 400 }),
		};
	}

	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir, { recursive: true });
	}

	const filepath = path.join(uploadDir, localFileName);
	fs.writeFileSync(filepath, buffer);

	return { url: `/uploads/${bucket}/${fileName}` };
}

export async function POST(req: NextRequest) {
	try {
		const session = await auth();
		const { file, bucket, fileName, error } = await validateUploadRequest(req, session);
		if (error) return error;

		const buffer = Buffer.from(await file!.arrayBuffer());

		const sbResult = await uploadToSupabase(buffer, fileName!, file!.type, bucket!);
		if (!sbResult.error && sbResult.url) {
			return NextResponse.json({ success: true, url: sbResult.url });
		}

		const localResult = await uploadToLocalStorage(buffer, fileName!, bucket!);
		if (localResult.error) return localResult.error;

		return NextResponse.json({ success: true, url: localResult.url });
	} catch (err: unknown) {
		console.error("Upload API error:", err);
		return NextResponse.json(
			{ error: "حدث خطأ غير متوقع أثناء الرفع" },
			{ status: 500 },
		);
	}
}
