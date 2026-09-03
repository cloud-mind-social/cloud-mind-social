import { Reveal } from "@/components/reveal";
import { processSteps } from "@/lib/data";
import { LeapTrack } from "@/components/lineart/leap-track";
import { SparkRule } from "@/components/lineart/spark-rule";
import { TraceFrame } from "@/components/lineart/trace-frame";
import { Spine } from "@/components/lineart/spine";

export function Approach() {
  return (
    <section
      id="approach"
      className="grain border-b border-rule bg-paper-soft text-ink"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            How it works
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[22ch] font-display text-4xl leading-[1.05] md:text-5xl">
            Understand first. Recommend second. Execute third.
          </h2>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-8 max-w-[26rem]">
            <SparkRule duration={1400} className="text-rule-strong" span={32} />
          </div>
        </Reveal>

        <div className="relative mt-14 space-y-12 md:mt-18 md:space-y-14">
          {/* The spine: one stroke down the whole process, racing as it goes. */}
          <div className="absolute top-2 bottom-2 left-[19px] w-px md:left-[23px]">
            <Spine className="text-rule-strong" />
          </div>

          {processSteps.map((step, i) => (
            <Reveal key={step.n} delay={140 + i * 90}>
              <div className="relative z-10 flex items-start gap-6">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper font-mono text-xs text-ink md:h-12 md:w-12">
                  <TraceFrame
                    radius={999}
                    duration={900}
                    delay={i * 120}
                    direction={i % 2 ? "rev" : "fwd"}
                    className="text-rule-strong"
                  />
                  {step.n}
                </span>
                <div className="pt-1.5 md:pt-2.5">
                  <h3 className="font-display text-2xl md:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[58ch] text-[15px] leading-relaxed text-ink-mid md:text-base">
                    {step.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12">
          <LeapTrack duration={7} height={22} className="text-sage" />
        </div>
      </div>
    </section>
  );
}
