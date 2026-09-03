import { Reveal } from "@/components/reveal";
import { SparkRule } from "@/components/lineart/spark-rule";
import { TraceFrame } from "@/components/lineart/trace-frame";

export function Recognition() {
  return (
    <section className="relative overflow-hidden border-b border-rule bg-paper-soft">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            What we keep seeing
          </p>
        </Reveal>

        <Reveal delay={60}>
          <div className="mt-4 max-w-[22rem]">
            <SparkRule duration={1300} className="text-sage/70" span={30} />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="relative mt-8 w-fit py-8 pr-10 pl-10">
            <TraceFrame
              radius={3}
              duration={2100}
              corners
              className="text-rule-strong"
            />
            <p className="max-w-[26ch] font-display text-3xl leading-snug text-ink md:max-w-[24ch] md:text-4xl">
              Most businesses that reach out have already tried something.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-10 max-w-[62ch] text-lg leading-relaxed text-ink-mid">
            A cousin who&apos;s &ldquo;good at Instagram.&rdquo; A freelancer
            from a Facebook group. A flat-rate content mill posting the same
            caption format for every client it has. None of it was wrong,
            exactly — it just wasn&apos;t aimed at anything. Content without
            a diagnosis is just noise with good lighting.
          </p>
        </Reveal>

        <Reveal delay={280}>
          <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-ink-mid">
            That&apos;s the gap this practice fills — figuring out what&apos;s
            actually needed before anyone touches a content calendar.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
