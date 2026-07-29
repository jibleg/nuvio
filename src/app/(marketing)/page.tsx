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
        <Manifesto />
        <FinalCTA />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
