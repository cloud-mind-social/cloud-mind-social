import { Reveal } from "@/components/reveal";
import { faqs } from "@/lib/data";
import { SparkRule } from "@/components/lineart/spark-rule";

export function Faq() {
  return (
    <section
      id="faq"
      className="grain border-b border-rule bg-paper-soft text-ink"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            Before you call
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[20ch] font-display text-4xl leading-[1.05] md:text-5xl">
            The questions that come up first.
          </h2>
        </Reveal>

        <div className="mt-12">
          {faqs.map((item, i) => (
            <div key={item.q}>
              <SparkRule
                duration={950 + i * 260}
                delay={i * 70}
                className="text-rule"
                span={26 + i * 4}
              />
              <Reveal delay={120 + i * 70}>
                <details className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                    <span className="font-display text-xl leading-snug md:text-2xl">
                      <span className="cms-underline">{item.q}</span>
                    </span>
                    {/* Two strokes; one of them swings out of the way. */}
                    <span
                      aria-hidden
                      className="relative block h-4 w-4 shrink-0 text-amber"
                    >
                      <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-current transition-transform duration-500 ease-overshoot group-open:rotate-180" />
                      <span className="absolute top-0 left-1/2 block h-full w-px -translate-x-1/2 bg-current transition-transform duration-700 ease-overshoot group-open:rotate-90 group-open:scale-y-0" />
                    </span>
                  </summary>
                  <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink-mid md:text-base">
                    {item.a}
                  </p>
                </details>
              </Reveal>
            </div>
          ))}
          <SparkRule duration={1500} className="text-rule" span={44} />
        </div>
      </div>
    </section>
  );
}
