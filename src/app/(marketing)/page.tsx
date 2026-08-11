import {
  Nav,
  Hero,
  ValuesStrip,
  Story,
  Modules,
  Connected,
  Productivity,
  Roadmap,
  ForPeople,
  Testimonial,
  Plans,
  Manifesto,
  FinalCTA,
  Footer,
  ScrollProgress,
  BackToTop,
} from "@/features/marketing";
import { getCurrentTenant } from "@/features/tenant";

export default async function Home() {
  const tenant = await getCurrentTenant();
  const isTenant = tenant !== null;

  return (
    <>
      <ScrollProgress />
      <Nav isTenant={isTenant} />
      <main>
        <Hero isTenant={isTenant} />
        <ValuesStrip />
        <Story />
        <Modules />
        <Connected />
        <Productivity />
        <Roadmap />
        <ForPeople />
        <Testimonial />
        <Plans isTenant={isTenant} />
        <Manifesto />
        <FinalCTA />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
