import { Reveal } from "@/components/reveal";

export function Recognition() {
  return (
    <section className="border-b border-line bg-ink-soft">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
            What we keep seeing
          </p>
        </Reveal>

        <Reveal delay={100}>
          <p className="mt-8 max-w-[36ch] font-display text-3xl leading-snug text-cream md:max-w-[30ch] md:text-4xl">
            Most businesses that reach out have already tried something.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-8 max-w-[62ch] text-lg leading-relaxed text-cream-dim">
            A cousin who&apos;s &ldquo;good at Instagram.&rdquo; A freelancer
            from a Facebook group. A flat-rate content mill posting the same
            caption format for every client it has. None of it was wrong,
            exactly — it just wasn&apos;t aimed at anything. Content without
            a diagnosis is just noise with good lighting.
          </p>
        </Reveal>

        <Reveal delay={280}>
          <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-cream-dim">
            That&apos;s the gap this practice fills — figuring out what&apos;s
            actually needed before anyone touches a content calendar.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
