import { Reveal } from "@/components/reveal";
import { NetworkDiagram } from "@/components/network-diagram";
import { Burst } from "@/components/lineart/burst";
import { LeapTrack } from "@/components/lineart/leap-track";
import { SparkRule } from "@/components/lineart/spark-rule";
import { TraceFrame } from "@/components/lineart/trace-frame";

export function Hero() {
  return (
    <section
      id="top"
      className="grain relative overflow-hidden border-b border-rule"
    >
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-16 px-6 pb-14 pt-16 md:px-10 md:pb-20 md:pt-24 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0">
          <Reveal>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
              A diagnosis-first practice
            </p>
          </Reveal>

          <Reveal delay={40}>
            <div className="mt-4 max-w-[18rem] text-sage">
              <SparkRule duration={1100} delay={220} className="text-sage" />
            </div>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-2 font-display text-[13vw] leading-[0.94] tracking-[-0.01em] text-ink sm:text-6xl md:text-7xl">
              Diagnosis
              <br />
              before{" "}
              <em className="cms-underline italic text-amber" data-run="true">
                prescription.
              </em>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-ink-mid">
              We look at what a business actually needs before recommending
              anything — then bring in the specific specialists to do that,
              and nothing else.
            </p>
          </Reveal>

          <Reveal delay={270}>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href="#start"
                className="cms-live relative isolate rounded-full px-7 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-amber-deep transition-transform duration-500 ease-overshoot hover:scale-[1.04]"
              >
                <TraceFrame
                  radius={999}
                  strokeWidth={1.2}
                  duration={1200}
                  delay={520}
                  runner
                  runnerDuration={4200}
                  className="text-amber/60"
                  runnerClassName="text-amber"
                />
                Start a conversation
              </a>
              <a
                href="#diagnosis"
                className="group inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ink"
              >
                <span className="cms-link">See how a diagnosis reads</span>
                <span className="transition-transform duration-500 ease-overshoot group-hover:translate-x-1.5">
                  →
                </span>
              </a>
            </div>
          </Reveal>

          <Reveal delay={360}>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              No pitch on the first call — a diagnosis.
            </p>
          </Reveal>
        </div>

        <Reveal delay={220} className="relative mx-auto w-full min-w-0 lg:mx-0">
          <Burst size={210} spokes={11} delay={1500} className="text-amber/70" />
          <NetworkDiagram />
        </Reveal>
      </div>

      {/* The runner heads for the next section. */}
      <div className="mx-auto max-w-[1180px] px-6 pb-6 md:px-10">
        <LeapTrack duration={6.4} height={28} className="text-sage" />
      </div>
    </section>
  );
}
