import { Reveal } from "@/components/reveal";
import { NetworkDiagram } from "@/components/network-diagram";

export function Hero() {
  return (
    <section id="top" className="grain relative overflow-hidden border-b border-line">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-16 px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0">
          <Reveal>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
              A diagnosis-first practice
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-6 font-display text-[13vw] leading-[0.94] tracking-[-0.01em] text-cream sm:text-6xl md:text-7xl">
              Diagnosis
              <br />
              before <em className="italic text-amber">prescription.</em>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-cream-dim">
              We look at what a business actually needs before recommending
              anything — then bring in the specific specialists to do that,
              and nothing else.
            </p>
          </Reveal>

          <Reveal delay={270}>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href="#start"
                className="rounded-full bg-amber px-7 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink transition-transform hover:scale-[1.03]"
              >
                Start a conversation
              </a>
              <a
                href="#diagnosis"
                className="group inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-cream"
              >
                See how a diagnosis reads
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </Reveal>

          <Reveal delay={360}>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-cream-faint">
              No pitch on the first call — a diagnosis.
            </p>
          </Reveal>
        </div>

        <Reveal delay={220} className="mx-auto w-full min-w-0 lg:mx-0">
          <NetworkDiagram />
        </Reveal>
      </div>
    </section>
  );
}
