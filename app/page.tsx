import { GroupDiningSection } from "@/components/home/group-dining-section";
import { FaqSection } from "@/components/home/faq-section";
import { HeroSection } from "@/components/home/hero-section";
import { LocationSection } from "@/components/home/location-section";
import { MobileBookingBar } from "@/components/home/mobile-booking-bar";
import { ReservationBanner } from "@/components/home/reservation-banner";
import { ReviewsSection } from "@/components/home/reviews-section";
import { SignatureMenuSection } from "@/components/home/signature-menu-section";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { StorySection } from "@/components/home/story-section";
import { buildSiteRestaurantStructuredData } from "@/lib/site-structured-data";

export default function Home() {
  const structuredData = buildSiteRestaurantStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader home />
      <main>
        <HeroSection />
        <SignatureMenuSection />
        <StorySection />
        <GroupDiningSection />
        <ReviewsSection />
        <LocationSection />
        <FaqSection />
        <ReservationBanner />
      </main>
      <SiteFooter />
      <MobileBookingBar />
    </>
  );
}
