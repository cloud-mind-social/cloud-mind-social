import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Recognition } from "@/components/recognition";
import { DiagnosisExample } from "@/components/diagnosis-example";
import { Approach } from "@/components/approach";
import { ServicePaths } from "@/components/service-paths";
import { Capabilities } from "@/components/capabilities";
import { Differentiators } from "@/components/differentiators";
import { Faq } from "@/components/faq";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Recognition />
        <DiagnosisExample />
        <Approach />
        <ServicePaths />
        <Capabilities />
        <Differentiators />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
