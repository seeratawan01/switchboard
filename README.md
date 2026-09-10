# Switchboard

**What do you want for yourself?**

A wall of big pill switches, each one something a person wants to be or do: *Heal from my childhood*, *Cut off everyone toxic*, *Be funnier*, *Say exactly what I think*. Flip on what you want. The board shows which wants pull against each other, and every reaction can be tapped to reveal the paper behind it.

No AI in the loop. Every reaction comes from a small, deterministic rule engine driven by two models from personality psychology. The whole board fits in the link you share.

## How it works

**The interpersonal circumplex.** Personality psychology's standard map of how people relate: a circle with two axes, warmth across and dominance up. Behaviors next to each other reinforce; behaviors across the circle are in tension. Every switch gets an angle on that circle. For a goal, the angle is the stance the goal asks of you; for a style, it's the stance the style is.

Compatibility between two switches is one line:

```
compat(a, b) = cos(θa − θb)

  compat >  0.3   → they get along (a boost)
  −0.3 … 0.3      → they argue (a warning chip)
  −0.8 … −0.3     → the style is turned down to its gentle variant
  compat < −0.8   → the style locks off (always overridable)
```

Goals can lock or soften a style. Two styles can only warn each other.

**Humor isn't one thing.** *Be funnier* is affiliative humor, the warm shared kind. *Be sarcastic* is aggressive humor, so it's a separate switch that needs *Be funnier* on first. When a heavy goal is on the board, humor doesn't switch off; it drops to its gentle variant.

**One more axis.** *Understand myself deeply* and *Stop overanalyzing myself* look like the same habit from the outside. When both are on, the board flags them together and the card explains the difference between reflection and rumination.

**Two tiers, kept apart.** Research-tier chips cite a paper and say how strong the evidence is. House rules are jokes, marked as such, and never change state.

## The research

| Source | What it backs |
|---|---|
| Leary (1957); Wiggins (1979), *Interpersonal Circumplex* | The whole `compat()` formula |
| Martin et al. (2003), *Humor Styles Questionnaire*, J. Research in Personality | The funny/sarcastic split and the gentle variant |
| Gelkopf (2011), *Humor in serious mental illness: a review*, eCAM | Why humor stays on, softened, under a heavy topic. The review itself calls the evidence thin, and so does the card. |
| Kruger, Epley, Parker & Ng (2005), *Egocentrism over e-mail*, JPSP | The permanent warning on sarcasm |
| Trapnell & Campbell (1999), *Distinguishing rumination from reflection*, JPSP | The self-focus axis |

Links to each paper are on the About page in the app and in `lib/research.ts`. The angles are defensible starting points, not measurements; *Cut off everyone toxic* has no dedicated source for its placement, and any card it triggers says so.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # engine tests (vitest)
pnpm lint
pnpm build        # static export → out/
```

Requires Node 20+ and pnpm. The build is a fully static site with no server, so `out/` can be hosted anywhere.

Social previews (Open Graph and Twitter cards) need an absolute URL. On Vercel it's picked up automatically from the production domain; anywhere else, set `NEXT_PUBLIC_SITE_URL=https://your-domain` before `pnpm build`.

Add `?debug=1` to the URL for angle sliders and a live compatibility readout.

## Project layout

```
lib/toggles.ts     the switches: labels, angles, variants, dependencies (data, not code)
lib/rules.ts       compat(), resolve(state) → effects. Pure, no React.
lib/research.ts    chip and card copy per reason, plus the sources
lib/state.ts       reducer: toggle, override, strict mode, URL hydration
lib/url-state.ts   ?on=…&over=…&strict=1
components/        the toggle wall, wires, circle, cards, toast
app/               Next.js App Router: / and /about
```

The engine is the part worth reading first. It's a pure function with a table of tests in `lib/rules.test.ts` that pin every headline interaction, so retuning an angle or a threshold tells you immediately what changed.

## Changing things

- **Retune an angle:** edit `theta` in `lib/toggles.ts`, then run `pnpm test`. The `?debug=1` sliders let you feel it out first.
- **Add a switch:** add an entry to `TOGGLES` with a `label`, a gerund `phrase` (used in chips: "healing from your childhood"), a `kind`, and an angle if it belongs on the circle. Every new switch is *n* new pairs to check, so add a test row.
- **Add a reason:** add a `ReasonId` in `lib/types.ts` and its copy in `lib/research.ts`. Research-tier reasons must cite a source and carry an `evidence` rating. If there's no paper, it's a house rule and gets marked as one.

House style for copy: the board speaks in first person, dry and short. No exclamation marks, no emoji, nothing starting with "Sorry".

## Stack

Next.js (App Router, static export) · React · TypeScript · Tailwind CSS · Framer Motion · Vitest

## Contributing

Issues and pull requests are welcome. If you're proposing a new switch or a new rule, include the source that backs it; if there isn't one, say so and it can live in the house-rule tier. Keep `pnpm test` and `pnpm lint` green.

## License

MIT. See [LICENSE](./LICENSE).

---

Created by [@seeratawan01](https://x.com/seeratawan01).
