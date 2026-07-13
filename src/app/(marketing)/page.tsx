import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import FeaturesSection from "@/components/landing/FeaturesSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <>
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <FeaturesSection />
      </main>
      <LandingFooter />
    </>
  );
}
