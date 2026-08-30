import { Reveal } from "@/components/reveal";
import { faqs } from "@/lib/data";

export function Faq() {
  return (
    <section
      id="faq"
      className="grain on-paper border-b border-line-ink bg-paper text-paper-ink"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage-dim">
            Before you call
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[20ch] font-display text-4xl leading-[1.05] md:text-5xl">
            The questions that come up first.
          </h2>
        </Reveal>

        <div className="mt-14 divide-y divide-paper-ink/15 border-y border-paper-ink/15">
          {faqs.map((item, i) => (
            <Reveal key={item.q} delay={120 + i * 70}>
              <details className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                  <span className="font-display text-xl leading-snug md:text-2xl">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 font-mono text-xl text-amber transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-paper-ink/70 md:text-base">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
