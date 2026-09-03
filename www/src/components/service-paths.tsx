import { type CSSProperties } from "react";

import { Reveal } from "@/components/reveal";
import { servicePaths } from "@/lib/data";
import { LeapTrack } from "@/components/lineart/leap-track";
import { SparkRule } from "@/components/lineart/spark-rule";
import { TraceFrame } from "@/components/lineart/trace-frame";

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

        <Reveal delay={140}>
          <div className="mt-8 max-w-[24rem]">
            <SparkRule duration={1500} className="text-sage/70" span={30} />
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {servicePaths.map((path, i) => (
            <Reveal
              key={path.index}
              delay={140 + i * 90}
              from={i % 2 ? "right" : "left"}
            >
              <article className="group relative flex h-full flex-col rounded-2xl p-8">
                {/* Each card's pen sets off at its own speed, in its own
                    direction — no two arrive together. */}
                <TraceFrame
                  radius={16}
                  duration={1400 + i * 260}
                  delay={i * 90}
                  direction={i % 2 ? "rev" : "fwd"}
                  runner
                  runnerDuration={6400 + i * 900}
                  runnerDelay={i * 400}
                  className="text-line"
                  runnerClassName="text-sage"
                />

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream-faint">
                    Path {path.index}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
                    {path.billing}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-2xl text-cream md:text-3xl">
                  <span className="cms-underline">{path.name}</span>
                </h3>

                <p className="mt-3 text-[15px] leading-relaxed text-cream-dim">
                  {path.description}
                </p>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {path.examples.map((example, j) => (
                    <li
                      key={example}
                      className="cms-wipe rounded-full border border-line px-3.5 py-1.5 font-mono text-[11px] text-cream-dim"
                      style={{
                        "--wipe-dur": `${620 + j * 120}ms`,
                        "--wipe-delay": `${420 + i * 90 + j * 110}ms`,
                        "--wipe-to": `${26 + j * 5}%`,
                      } as CSSProperties}
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

        <div className="mt-10">
          <LeapTrack duration={6.1} height={24} className="text-amber/80" />
        </div>
      </div>
    </section>
  );
}
