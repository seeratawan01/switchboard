/** One place for everything that needs the public URL: metadata, sitemap, robots, structured data. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "Switchboard";
export const TAGLINE = "What do you want for yourself?";
export const DESCRIPTION =
  "Flip on everything you want to be or do. Some of it can't be true at the same time, and the board shows you which wants fight each other, with the psychology paper behind every reaction.";
export const AUTHOR = { name: "@seeratawan01", url: "https://x.com/seeratawan01" };

export const KEYWORDS = [
  "interpersonal circumplex",
  "personality psychology",
  "self-reflection",
  "rumination vs reflection",
  "humor styles",
  "interactive psychology",
  "what do you want for yourself",
  "self-improvement toy",
];

/** JSON-LD helper: escape `<` so a script tag can't be closed early. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
