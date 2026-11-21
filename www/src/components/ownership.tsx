import { Reveal } from "@/components/reveal";
import { ownership } from "@/lib/data";
import { SparkRule } from "@/components/lineart/spark-rule";
import { TraceFrame } from "@/components/lineart/trace-frame";

/**
 * Phase 3.8: human ownership, made visible. Who is accountable, how the
 * specialists are chosen, and what happens at a handoff. Roles, not names,
 * until the named owners are confirmed.
 */
export function Ownership() {
  return (
    <section id="who" className="grain border-b border-rule bg-paper text-ink">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            Who you work with
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[22ch] font-display text-4xl leading-[1.05] md:text-5xl">
            A person owns your work, start to finish.
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-8 max-w-[26rem]">
            <SparkRule duration={1400} className="text-rule-strong" span={32} />
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {ownership.map((item, i) => (
            <Reveal key={item.n} delay={120 + i * 80}>
              <div className="relative h-full rounded-2xl p-7">
                <TraceFrame
                  radius={16}
                  duration={1200 + i * 200}
                  delay={i * 90}
                  direction={i % 2 ? "rev" : "fwd"}
                  className="text-rule"
                />
                <p className="font-mono text-[12px] text-ink-faint">{item.n}</p>
                <h3 className="mt-3 font-display text-2xl">{item.title}</h3>
                <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-mid">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
