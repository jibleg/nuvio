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
        <Plans />
        <Manifesto />
        <FinalCTA />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
