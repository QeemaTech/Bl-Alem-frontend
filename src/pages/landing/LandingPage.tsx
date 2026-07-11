import LandingHeader from '../../components/landing/LandingHeader';
import HeroSection from '../../components/landing/HeroSection';
import StatsSection from '../../components/landing/StatsSection';
import FeaturesSection from '../../components/landing/FeaturesSection';
import StudentExperienceSection from '../../components/landing/StudentExperienceSection';
import InstructorExperienceSection from '../../components/landing/InstructorExperienceSection';
import CoursesPreviewSection from '../../components/landing/CoursesPreviewSection';
import HowItWorksSection from '../../components/landing/HowItWorksSection';
import LiveSessionsSection from '../../components/landing/LiveSessionsSection';
import CertificatesRewardsSection from '../../components/landing/CertificatesRewardsSection';
import AdminManagementSection from '../../components/landing/AdminManagementSection';
import TestimonialsSection from '../../components/landing/TestimonialsSection';
import FAQSection from '../../components/landing/FAQSection';
import FinalCTASection from '../../components/landing/FinalCTASection';
import LandingFooter from '../../components/landing/LandingFooter';
import { useLandingLocale } from '../../hooks/useLandingLocale';

export default function LandingPage() {
  const { lang, dir } = useLandingLocale();

  return (
    <div className="lp-root" dir={dir} lang={lang} style={{ background: '#F8FAFC' }}>
      <LandingHeader />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <StudentExperienceSection />
        <InstructorExperienceSection />
        <CoursesPreviewSection />
        <HowItWorksSection />
        <LiveSessionsSection />
        <CertificatesRewardsSection />
        <AdminManagementSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
