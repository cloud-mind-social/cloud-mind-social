import { Reveal } from "@/components/reveal";
import { diagnosisExample } from "@/lib/data";
import { SparkRule } from "@/components/lineart/spark-rule";
import { TraceFrame } from "@/components/lineart/trace-frame";

const fields = [
  { label: "Situation", text: diagnosisExample.situation },
  { label: "What's actually happening", text: diagnosisExample.reality },
  { label: "Recommended now", text: diagnosisExample.recommendNow },
  { label: "Not recommended yet", text: diagnosisExample.recommendLater },
];

export function DiagnosisExample() {
  return (
    <section id="diagnosis" className="border-b border-rule bg-paper">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            How a diagnosis actually reads
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[26ch] font-display text-4xl leading-[1.05] text-ink md:text-5xl">
            What gets said before anything gets sold.
          </h2>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-8 max-w-[30rem]">
            <SparkRule duration={1500} className="text-amber/60" span={34} />
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="relative mt-10 max-w-[720px] rounded-lg bg-paper p-8 text-ink shadow-[0_22px_48px_-28px_rgba(30,43,72,0.35)] md:-rotate-[0.4deg] md:p-12">
            <TraceFrame
              radius={8}
              strokeWidth={1.2}
              duration={2400}
              runner
              runnerDuration={9000}
              corners
              className="text-rule-strong"
              runnerClassName="text-amber"
            />

            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              {diagnosisExample.label}
            </p>

            <dl className="mt-8 space-y-8">
              {fields.map((field, i) => (
                <div key={field.label} className="relative">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-sage">
                    {field.label}
                  </dt>
                  <div className="mt-2 max-w-[16rem]">
                    <SparkRule
                      duration={900 + i * 160}
                      delay={i * 120}
                      className="text-rule"
                      span={26 + i * 4}
                    />
                  </div>
                  <dd className="mt-1 max-w-[58ch] font-display text-lg leading-relaxed md:text-xl">
                    {field.text}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
