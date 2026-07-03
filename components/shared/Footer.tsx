import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
    const t = useTranslations('common');
	return (
		<footer className="w-full bg-card border-t border-border mt-auto py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					<div className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} {t('idywnst_jmya_alhqwq_mhfwdhh')}</div>
					<div className="flex gap-6 text-sm text-muted-foreground">
						<Link href="/help" className="hover:text-primary transition-colors">
							{t('mrkz_almsaadh')}</Link>
						<Link
							href="/privacy"
							className="hover:text-primary transition-colors"
						>
							{t('syash_alkhswsyh')}</Link>
						<Link
							href="/terms"
							className="hover:text-primary transition-colors"
						>
							{t('shrwt_alastkhdam')}</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
