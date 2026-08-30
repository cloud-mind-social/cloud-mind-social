import { Reveal } from "@/components/reveal";
import { DiscoveryForm } from "@/components/discovery-form";

const reassurances = [
  "No package pitch on this call",
  "One honest read on what's actually needed",
  "A reply within one business day",
];

export function Contact() {
  return (
    <section id="start" className="grain relative border-b border-line bg-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(closest-side,var(--color-amber)_0%,transparent_70%)] opacity-[0.07]"
      />
      <div className="mx-auto grid max-w-[1180px] gap-14 px-6 py-24 md:px-10 md:py-32 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <Reveal>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-sage">
              Start here
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-6 max-w-[16ch] font-display text-4xl leading-[1.05] text-cream md:text-5xl">
              Start with a conversation, not a contract.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-[42ch] text-cream-dim">
              Tell us where the business actually is. We&apos;ll tell you,
              honestly, what it needs next.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <ul className="mt-10 space-y-3">
              {reassurances.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-cream-faint"
                >
                  <span className="h-1 w-1 rounded-full bg-sage" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <DiscoveryForm />
        </Reveal>
      </div>
    </section>
  );
}
