"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export default function LanguageSwitcher() {
	const locale = useLocale();
	const pathname = usePathname();

	// أزل أي بادئة لغة موجودة حالياً بالمسار للحصول على مسار محايد
	const pathWithoutLocale = (pathname || "/").replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
	const arHref = pathWithoutLocale;
	const enHref = pathWithoutLocale === "/" ? "/en" : `/en${pathWithoutLocale}`;

	return (
		<div className="flex items-center gap-1.5 text-xs font-semibold">
			<Link
				href={arHref}
				className={locale === "ar" ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"}
			>
				عربي
			</Link>
			<span className="text-muted-foreground/50">|</span>
			<Link
				href={enHref}
				className={locale === "en" ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"}
			>
				EN
			</Link>
		</div>
	);
}
