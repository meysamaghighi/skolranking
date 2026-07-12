#!/usr/bin/env node
// IndexNow ping — notifies Bing (and other IndexNow-partner search engines,
// including the index that powers ChatGPT search) of the site's current
// sitemap URLs on every production deploy.
//
// Fail-soft by design: this must NEVER break a Vercel build. Any network
// error, non-OK response, or unexpected exception is logged as a warning
// and the process exits 0.
//
// Runs only when VERCEL_ENV === "production" (set automatically by Vercel
// on production deployments — NOT set for local builds, preview deploys,
// or `next build` run by hand). Everywhere else this is a silent no-op.
//
// NOTE: this repo previously had a bug where a middleware matcher caught
// /sitemap.xml and broke GSC's ability to fetch it (see
// SITEMAP_DIAGNOSIS.md). There is currently no middleware.ts and no
// vercel.json rewrite in this repo, so app/sitemap.ts serves the default
// Next.js route at /sitemap.xml directly — confirmed live via curl before
// wiring this up. If middleware/rewrites are reintroduced later, make sure
// its matcher still excludes /sitemap.xml, or update SITEMAP_URL below to
// match wherever the sitemap actually lives.

const HOST = "skolranking.com";
const KEY = "8797c808273a2fd74aea0ea2ecccd0e6";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10000; // IndexNow API limit

async function getSitemapUrls() {
  const res = await fetch(SITEMAP_URL, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    throw new Error(`failed to fetch sitemap (${SITEMAP_URL}): HTTP ${res.status}`);
  }
  const xml = await res.text();
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map((m) => m[1].trim()).filter(Boolean);
}

async function main() {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv !== "production") {
    console.log(
      `[indexnow] skipping ping (VERCEL_ENV=${vercelEnv || "unset"}, not production)`
    );
    return;
  }

  const urls = await getSitemapUrls();
  if (urls.length === 0) {
    console.warn("[indexnow] sitemap returned zero URLs, skipping ping");
    return;
  }

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls.slice(0, MAX_URLS_PER_REQUEST),
  };

  if (process.env.INDEXNOW_DRY_RUN === "1") {
    console.log(
      `[indexnow] DRY RUN — would POST ${body.urlList.length} URLs to ${INDEXNOW_ENDPOINT}`
    );
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (res.ok) {
    console.log(`[indexnow] pinged ${body.urlList.length} URLs — HTTP ${res.status}`);
  } else {
    const text = await res.text().catch(() => "");
    console.warn(`[indexnow] ping returned non-OK status ${res.status}: ${text}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.warn("[indexnow] ping failed (non-fatal):", err && err.message ? err.message : err);
    process.exit(0);
  });
