import { Reveal } from "@/components/reveal";
import { commitments } from "@/lib/data";
import { Burst } from "@/components/lineart/burst";
import { SparkRule } from "@/components/lineart/spark-rule";

export function Differentiators() {
  return (
    <section className="border-b border-line bg-ink">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            What you can count on
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[22ch] font-display text-4xl leading-[1.05] text-cream md:text-5xl">
            What doesn&apos;t change once you&apos;re a client.
          </h2>
        </Reveal>

        <div className="mt-14">
          {commitments.map((pillar, i) => (
            <div key={pillar.n}>
              {/* Every rule between commitments runs the width of the page
                  at its own pace — none of them arrive together. */}
              <SparkRule
                duration={1100 + i * 320}
                delay={i * 80}
                className="text-line-strong"
                span={30 + i * 6}
              />
              <Reveal delay={140 + i * 90}>
                <div className="flex flex-col gap-4 py-9 md:flex-row md:items-baseline md:gap-10">
                  <span className="relative font-display text-4xl italic text-sage md:w-24 md:shrink-0 md:text-5xl">
                    <Burst
                      size={130}
                      spokes={8}
                      duration={820}
                      delay={i * 60}
                      className="text-sage/70"
                    />
                    <span className="relative">{pillar.n}</span>
                  </span>
                  <div>
                    <h3 className="font-display text-2xl text-cream md:text-3xl">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 max-w-[58ch] text-[15px] leading-relaxed text-cream-dim md:text-base">
                      {pillar.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          ))}
          <SparkRule
            duration={1600}
            className="text-line-strong"
            span={48}
          />
        </div>
      </div>
    </section>
  );
}
