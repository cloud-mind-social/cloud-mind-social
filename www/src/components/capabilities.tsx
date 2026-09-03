import { type CSSProperties } from "react";

import { Reveal } from "@/components/reveal";
import { capabilityGroups } from "@/lib/data";
import { SparkRule } from "@/components/lineart/spark-rule";

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="grain border-b border-rule bg-paper-soft text-ink"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            Capabilities
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[24ch] font-display text-4xl leading-[1.05] md:text-5xl">
            One network, every capability a growing business runs into.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {capabilityGroups.map((group, i) => (
            <Reveal key={group.label} delay={140 + i * 80}>
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                  {group.label}
                </h3>
                <div className="mt-3 max-w-[18rem]">
                  <SparkRule
                    duration={1000 + i * 180}
                    delay={i * 90}
                    className="text-rule-strong"
                    span={26 + i * 3}
                  />
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item, j) => (
                    <li
                      key={item}
                      className="cms-wipe cms-chip rounded-full border border-rule px-3.5 py-1.5 text-[13px] text-ink-mid"
                      style={{
                        "--wipe-dur": `${560 + j * 90}ms`,
                        "--wipe-delay": `${i * 120 + j * 70}ms`,
                        "--wipe-to": `${22 + j * 4}%`,
                      } as CSSProperties}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={520}>
          <div className="relative mt-16 py-2 pl-6">
            <span
              aria-hidden
              className="absolute top-0 bottom-0 left-0 w-[2px] origin-top bg-amber"
            />
            <p className="max-w-[62ch] font-display text-xl italic leading-relaxed md:text-2xl">
              The same photo does two jobs. It&apos;s content when it builds
              presence organically — and it becomes ad creative the moment a
              budget and a conversion goal are attached to it. We price and
              design for whichever job it&apos;s actually doing.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
