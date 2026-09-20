import { FaqSection } from "@/components/home/faq-section";
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
import { getHomeCopy, getHomePath, LOCALE_CONFIG, type Locale } from "@/lib/home-i18n";
import { buildSiteRestaurantStructuredData } from "@/lib/site-structured-data";

type LocalizedHomepageProps = { locale: Locale };

export function LocalizedHomepage({ locale }: LocalizedHomepageProps) {
  const copy = getHomeCopy(locale);
  const homePath = getHomePath(locale);
  const structuredData = buildSiteRestaurantStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <div lang={LOCALE_CONFIG[locale].htmlLang}>
        <SiteHeader locale={locale} copy={copy.header} homePath={homePath} home />
        <main>
          <HeroSection copy={copy.hero} />
          <SignatureMenuSection copy={copy.signature} />
          <StorySection copy={copy.story} />
          <GroupDiningSection copy={copy.group} branches={copy.branches} />
          <ReviewsSection copy={copy.reviews} />
          <LocationSection copy={copy.locations} branches={copy.branches} />
          <FaqSection copy={copy.faq} />
          <ReservationBanner copy={copy.reservation} />
        </main>
        <SiteFooter copy={copy.footer} branches={copy.branches} homePath={homePath} />
        <MobileBookingBar copy={copy.mobileBooking} />
      </div>
    </>
  );
}
