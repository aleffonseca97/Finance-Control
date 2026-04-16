import LandingNav from './landing-nav'
import HeroSection from './hero-section'
import StatsBar from './stats-bar'
import FeaturesSection from './features-section'
import ScreenshotsSection from './screenshots-section'
import PricingSection from './pricing-section'
import FaqSection from './faq-section'
import CtaBanner from './cta-banner'
import MarketingFooter from './marketing-footer'

export function LandingPage() {
  return (
    <div className="bg-white dark:bg-zinc-950 min-h-[100dvh]">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <ScreenshotsSection />
      <PricingSection />
      <FaqSection />
      <CtaBanner />
      <MarketingFooter />
    </div>
  )
}
