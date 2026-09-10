import type { Metadata } from "next";
import Link from "next/link";
import { TOGGLES } from "@/lib/toggles";
import { THRESHOLDS } from "@/lib/rules";
import { EVIDENCE_LABEL, REASONS, SOURCES, type SourceId } from "@/lib/research";
import type { ReasonId } from "@/lib/types";

export const metadata: Metadata = {
  title: "About Switchboard",
  description: "What the board is, how it decides which wants fight, and the five papers behind it.",
};

/** Plain-English line per source: what it backs on the board. */
const BACKS: Record<SourceId, string> = {
  circumplex:
    "The whole compat() formula. Every lock, soften, warn and boost between two angled toggles comes from where they sit on this circle.",
  hsq: "The split between Be funnier and Be sarcastic, the gentle variant, and why being sarcastic needs Be funnier switched on first.",
  gelkopf: "Why humor stays on, in its gentle form, when a heavy topic like trauma is on the board instead of being switched off.",
  egocentrism: "The permanent warning that rides along with Sarcasm.",
  selffocus:
    "Why “Understand myself deeply” and “Stop overanalyzing myself” get flagged together: they look identical from the outside, and this is the paper that tells them apart.",
};

/** Evidence strength per source. Gelkopf is the only thin one; it says so itself. */
const STRENGTH: Record<SourceId, "strong" | "thin"> = {
  circumplex: "strong",
  hsq: "strong",
  gelkopf: "thin",
  egocentrism: "strong",
  selffocus: "strong",
};

const GELKOPF_CAVEAT = REASONS["humor-gentle"].caveat;

const NAMES = { target: "a toggle", by: "another toggle", targetPhrase: "one thing", byPhrase: "another" };

export default function AboutPage() {
  const angled = TOGGLES.filter((t) => t.theta !== undefined);
  const house = (Object.keys(REASONS) as ReasonId[]).map((k) => REASONS[k]).filter((r) => r.tier === "house");

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-8 md:py-12">
      <header className="mb-12">
        <p className="mb-3 flex items-baseline gap-4 text-[14px] leading-[18px]">
          <Link href="/" className="font-semibold hover:underline hover:underline-offset-2">
            Switchboard
          </Link>
          <span className="text-graphite">About</span>
        </p>
        <h1 className="text-[32px] leading-9 font-semibold mt-12">Not everything you want gets along.</h1>
        <p className="mt-3 text-[16px] leading-6 text-graphite">
          Switchboard is a wall of switches, each one something a person might want for their own life. Flip on what you
          want and the board shows which wants pull against each other, with the paper behind every reaction.
        </p>
      </header>

      <Section title="What it is">
        <p>
          The subject is you. &ldquo;Heal from my childhood&rdquo;, &ldquo;Cut off everyone toxic&rdquo;, &ldquo;Be funnier&rdquo;: every switch
          is something a person wants to be or do, in one grammar. Some of them ask for opposite stances at the same
          time. The board makes that visible, and when you ask why, the answer is a citation, not a joke.
        </p>
        <p>
          There is no AI in the loop and nothing is generated. Every reaction comes from a small, deterministic rule engine
          driven by two models from personality and learning psychology. The whole board fits in the link you share.
        </p>
      </Section>

      <Section title="How the board decides">
        <p>
          <strong>The interpersonal circumplex.</strong> Personality psychology&rsquo;s standard map of how people relate: a
          circle with two axes, warmth across and dominance up. Behaviors that sit next to each other reinforce; behaviors
          across the circle are in tension. Every angled toggle gets a position on that circle. For a goal, the position is
          the stance that goal asks of you; for a style, it&rsquo;s the stance the style is.
        </p>
        <p>
          Compatibility between two toggles is one line: the cosine of the angle between them. Above{" "}
          {THRESHOLDS.boost} they get along. Between {THRESHOLDS.warn} and {THRESHOLDS.boost} they argue and you get a warning.
          Between {THRESHOLDS.soften} and {THRESHOLDS.warn} the style is turned down to its gentler variant. Below{" "}
          {THRESHOLDS.soften} it locks off. Goals can lock or soften a style; two styles can only warn each other.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] leading-[18px]">
            <thead>
              <tr className="text-left text-graphite">
                <th className="py-2 pr-4 font-normal">Toggle</th>
                <th className="py-2 pr-4 font-normal">Kind</th>
                <th className="py-2 pr-4 font-normal">Angle</th>
              </tr>
            </thead>
            <tbody>
              {angled.map((t) => (
                <tr key={t.id} className="border-t border-ink/20">
                  <td className="py-2 pr-4">{t.label}</td>
                  <td className="py-2 pr-4 text-graphite">{t.kind === "outcome" ? "a goal" : "a style"}</td>
                  <td className="py-2 pr-4 tabular-nums">{t.theta}&deg;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[14px] leading-[18px] text-graphite">
          0&deg; is warm, 90&deg; dominant, 180&deg; cold, 270&deg; submissive. The angles are defensible starting points, not
          measurements. &ldquo;Cut off everyone toxic&rdquo; has no dedicated source for its placement, so any card it triggers
          says so.
        </p>
        <p>
          <strong>Humor isn&rsquo;t one thing.</strong> &ldquo;Be funnier&rdquo; is affiliative humor, the warm shared kind. Sarcasm is
          aggressive humor, so it&rsquo;s a separate switch that needs Be funnier on first. When a heavy goal is on the board,
          humor doesn&rsquo;t switch off; it drops to its gentle variant. That&rsquo;s the hatched state.
        </p>
        <p>
          <strong>One more axis.</strong> Attention turned inward isn&rsquo;t interpersonal, so it gets its own line under the
          circle. &ldquo;Understand myself deeply&rdquo; and &ldquo;Stop overanalyzing myself&rdquo; look like the same habit from the
          outside. Trapnell and Campbell split it in two: reflection runs on curiosity, rumination on worry. When both are
          on, the board flags them together and the card explains the difference.
        </p>
      </Section>

      <Section title="The research">
        <p>Five sources. Each card on the board points at one of them and says how strong the evidence is.</p>
        <ol className="flex flex-col gap-6">
          {(Object.keys(SOURCES) as SourceId[]).map((sid, i) => {
            const s = SOURCES[sid];
            const thin = STRENGTH[sid] === "thin";
            return (
              <li key={sid} className="rounded-[8px] bg-blush p-4 ring-1 ring-inset ring-ink">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[16px] leading-6 font-semibold">
                    {i + 1}. {s.cite}
                  </h3>
                  <span
                    className={`rounded-[4px] px-2 py-0.5 text-[14px] leading-[18px] font-semibold ring-1 ring-inset ring-ink ${thin ? "bg-amber" : "bg-blush"}`}
                  >
                    {EVIDENCE_LABEL[thin ? "thin" : "strong"]}
                  </span>
                </div>
                <p className="mt-2 text-[16px] leading-6">{BACKS[sid]}</p>
                {thin && GELKOPF_CAVEAT && (
                  <p className="mt-2 text-[16px] leading-6">
                    <span className="font-semibold">Caveat.</span> {GELKOPF_CAVEAT}
                  </p>
                )}
                <p className="mt-3 text-[13px] leading-[18px] text-graphite">
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">
                    {s.title}
                  </a>
                  . {s.venue}.
                </p>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section title="House rules">
        <p>
          A few reactions are jokes, and they&rsquo;re marked as such so the research tier stays honest. They add a chip and
          never change state.
        </p>
        <ul className="flex flex-col gap-2">
          {house.map((r) => (
            <li key={r.id} className="text-[16px] leading-6">
              <span className="text-graphite">House rule: </span>
              {r.chip(NAMES)}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Locks, overrides and strict mode">
        <p>
          Every lock can be overruled: tap the padlock and the switch flips on anyway, with a note that you did. An override
          lasts until the toggle that caused the lock changes, then it clears, so it never outlives its reason.
        </p>
        <p>
          <strong>Strict mode</strong> turns that off. While it&rsquo;s on, the board&rsquo;s locks stand, any overrides you&rsquo;d made
          are retracted, and the setting travels with the link you share.
        </p>
      </Section>

      <Section title="An honest note">
        <p>
          No switch heals a childhood or ends a relationship. Flipping one records what you want and shows what that want asks
          of the rest of you. The board can map the tension. The work is yours.
        </p>
      </Section>

      <footer className="mt-16 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 text-[13px] leading-[18px] text-graphite">
        <p>
          <Link href="/" className="text-ink underline underline-offset-2">
            Back to the board
          </Link>
        </p>
        <p className="ml-auto shrink-0 text-right">
          Created by{" "}
          <a href="https://x.com/seeratawan01" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">
            @seeratawan01
          </a>
        </p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 flex flex-col gap-4">
      <h2 className="text-[22px] leading-[26px] font-semibold">{title}</h2>
      <div className="flex flex-col gap-4 text-[16px] leading-6">{children}</div>
    </section>
  );
}
