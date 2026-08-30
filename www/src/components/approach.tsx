import { Reveal } from "@/components/reveal";
import { processSteps } from "@/lib/data";

export function Approach() {
  return (
    <section
      id="approach"
      className="grain on-paper border-b border-line-ink bg-paper text-paper-ink"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage-dim">
            How it works
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[22ch] font-display text-4xl leading-[1.05] md:text-5xl">
            Understand first. Recommend second. Execute third.
          </h2>
        </Reveal>

        <div className="relative mt-16 space-y-12 md:mt-20 md:space-y-14">
          <div className="absolute top-2 bottom-2 left-[19px] w-px bg-line-ink-strong md:left-[23px]" />

          {processSteps.map((step, i) => (
            <Reveal key={step.n} delay={140 + i * 90}>
              <div className="relative z-10 flex items-start gap-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-paper-ink/25 bg-paper font-mono text-xs text-paper-ink md:h-12 md:w-12">
                  {step.n}
                </span>
                <div className="pt-1.5 md:pt-2.5">
                  <h3 className="font-display text-2xl md:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[58ch] text-[15px] leading-relaxed text-paper-ink/70 md:text-base">
                    {step.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
