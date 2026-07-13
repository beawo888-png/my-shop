import { GroupDiningSection } from "@/components/home/group-dining-section";
import { HeroSection } from "@/components/home/hero-section";
import { LocationSection } from "@/components/home/location-section";
import { MobileBookingBar } from "@/components/home/mobile-booking-bar";
import { ReservationBanner } from "@/components/home/reservation-banner";
import { ReviewsSection } from "@/components/home/reviews-section";
import { SignatureMenuSection } from "@/components/home/signature-menu-section";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { StorySection } from "@/components/home/story-section";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <SignatureMenuSection />
        <StorySection />
        <GroupDiningSection />
        <ReviewsSection />
        <LocationSection />
        <ReservationBanner />
      </main>
      <SiteFooter />
      <MobileBookingBar />
    </>
  );
}
