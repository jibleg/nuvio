import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ValuesStrip } from "@/components/ValuesStrip";
import { Story } from "@/components/Story";
import { Modules } from "@/components/Modules";
import { Connected } from "@/components/Connected";
import { Productivity } from "@/components/Productivity";
import { Roadmap } from "@/components/Roadmap";
import { ForPeople } from "@/components/ForPeople";
import { Testimonial } from "@/components/Testimonial";
import { Manifesto } from "@/components/Manifesto";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { ScrollProgress } from "@/components/ScrollProgress";
import { BackToTop } from "@/components/BackToTop";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <ValuesStrip />
        <Story />
        <Modules />
        <Connected />
        <Productivity />
        <Roadmap />
        <ForPeople />
        <Testimonial />
        <Manifesto />
        <FinalCTA />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
