import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FeaturedAthletesSection from "@/components/landing/FeaturedAthletesSection";
import RankingSection from "@/components/landing/RankingSection";
import RecentGiftsSection from "@/components/landing/RecentGiftsSection";
import EventsSection from "@/components/landing/EventsSection";
import SponsorsSection from "@/components/landing/SponsorsSection";
import FAQSection from "@/components/landing/FAQSection";
import LandingContactSection from "@/components/landing/LandingContactSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <>
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <FeaturesSection />
        <FeaturedAthletesSection />
        <RankingSection />
        <RecentGiftsSection />
        <EventsSection />
        <SponsorsSection />
        <FAQSection />
        <LandingContactSection />
      </main>
      <LandingFooter />
    </>
  );
}
