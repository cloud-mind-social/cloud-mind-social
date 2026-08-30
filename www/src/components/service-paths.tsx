import { Reveal } from "@/components/reveal";
import { servicePaths } from "@/lib/data";

export function ServicePaths() {
  return (
    <section id="paths" className="border-b border-line bg-ink">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            Service depth
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[22ch] font-display text-4xl leading-[1.05] text-cream md:text-5xl">
            Four depths. One conversation decides which.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {servicePaths.map((path, i) => (
            <Reveal key={path.index} delay={140 + i * 90}>
              <article className="flex h-full flex-col rounded-2xl border border-line bg-ink-soft/60 p-8 transition-colors hover:border-line-strong">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream-faint">
                    Path {path.index}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
                    {path.billing}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-2xl text-cream md:text-3xl">
                  {path.name}
                </h3>

                <p className="mt-3 text-[15px] leading-relaxed text-cream-dim">
                  {path.description}
                </p>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {path.examples.map((example) => (
                    <li
                      key={example}
                      className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-cream-dim"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={520}>
          <p className="mx-auto mt-14 max-w-[46ch] text-center font-display text-lg italic text-cream-dim">
            The conversation decides which one — not the other way around.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
