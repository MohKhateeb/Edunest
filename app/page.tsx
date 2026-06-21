import React from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

// New Homepage Components
import HeroSection from '@/components/home/HeroSection';
import PersuasionSection from '@/components/home/PersuasionSection';
import JourneyPath from '@/components/home/JourneyPath';
import AssuranceSection from '@/components/home/AssuranceSection';
import FooterCTA from '@/components/home/FooterCTA';

export const metadata = {
  title: 'إديونست | المنصة التعليمية الفلسطينية الأولى',
  description:
    'ابحث عن معلم خصوصي موثوق لطفلك في الضفة الغربية. حجز فوري، دفع آمن، ومتابعة مستمرة.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        <PersuasionSection />
        <JourneyPath />
        <AssuranceSection />
        <FooterCTA />
      </main>

      <Footer />
    </div>
  );
}
