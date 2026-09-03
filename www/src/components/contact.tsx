import { Reveal } from "@/components/reveal";
import { DiscoveryForm } from "@/components/discovery-form";
import { Burst } from "@/components/lineart/burst";
import { SparkRule } from "@/components/lineart/spark-rule";
import { TraceFrame } from "@/components/lineart/trace-frame";

const reassurances = [
  "No package pitch on this call",
  "One honest read on what's actually needed",
  "A reply within one business day",
];

export function Contact() {
  return (
    <section id="start" className="grain relative border-b border-rule bg-paper">
      <div className="mx-auto grid max-w-[1180px] gap-14 px-6 py-24 md:px-10 md:py-32 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <Reveal>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
              Start here
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-6 max-w-[16ch] font-display text-4xl leading-[1.05] text-ink md:text-5xl">
              Start with a conversation, not a contract.
            </h2>
          </Reveal>
          <Reveal delay={130}>
            <div className="mt-6 max-w-[20rem]">
              <SparkRule duration={1300} className="text-amber/60" span={28} />
            </div>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 max-w-[42ch] text-ink-mid">
              Tell us where the business actually is. We&apos;ll tell you,
              honestly, what it needs next.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <ul className="mt-10 space-y-3">
              {reassurances.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-faint"
                >
                  <span className="h-1 w-1 rounded-full bg-sage" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="relative p-6 md:p-8">
            <TraceFrame
              radius={18}
              strokeWidth={1.2}
              duration={2600}
              runner
              runnerDuration={10000}
              corners
              className="text-rule"
              runnerClassName="text-amber"
            />
            {/* A little celebration at the corner where the box closes. */}
            <span
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 block h-0 w-0"
            >
              <Burst size={170} spokes={10} delay={1100} className="text-sage/50" />
            </span>
            <DiscoveryForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
