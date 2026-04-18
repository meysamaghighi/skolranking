# Sitemap Indexing Diagnosis — 2026-04-18

**Problem**: GSC reports 1,801 URLs submitted via sitemap, ~0 indexed via sitemap. Pages that do rank were discovered organically.

## Technical audit (all PASS)

| Check | Result |
|-------|--------|
| `/sitemap.xml` returns 200, valid XML, 326 KB, 1,801 `<loc>` entries | ✅ |
| Under Google limits (≤50 MB, ≤50,000 URLs) | ✅ |
| `/robots.txt` allows all + points to sitemap | ✅ |
| Sample pages (`/`, `/kommun/stockholm`, `/kommun/goteborg`, `/kommuner`, `/ranking`, random school) → 200 | ✅ |
| `metadataBase` set to `https://skolranking.com` | ✅ |
| Canonical tag on `/kommun/stockholm` = `https://skolranking.com/kommun/stockholm` (matches sitemap URL exactly, no trailing slash) | ✅ |
| `trailingSlash: false` | ✅ |
| No `noindex` / `nofollow` meta | ✅ |
| Both dynamic routes (`/kommun/[name]`, `/skola/[slug]`) use `dynamicParams = false` + `generateStaticParams()` → fully prerendered at build time | ✅ |

**Conclusion**: the sitemap is not technically broken. URLs are crawlable, canonical, returning 200, and fully indexable. Google is choosing not to index them.

## Why Google is refusing to index

### 1. `lastmod` noise (FIXABLE — fixed in this session)
`app/sitemap.ts` uses `new Date()` for every URL's `lastmod`. Every deploy rewrites all 1,801 `lastmod` values to "right now." Google has publicly said this makes `lastmod` useless at best and a negative signal at worst — see https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping (and John Mueller on Twitter repeatedly: "inaccurate lastmod = we'll ignore it"). If Google decides `lastmod` is garbage, it falls back to discovery order, and a no-authority domain has low crawl budget.

**Fix shipped**: replaced `new Date()` with stable `SITE_LAST_MODIFIED` / `CONTENT_LAST_MODIFIED` constants tied to content changes, not deploy time.

### 2. Thin, near-duplicate content on school pages (BIGGER FIX — not in scope today)
Each of the ~1,500+ `/skola/[slug]` pages is a template with swapped values (name, merit, rank, address). To Google's SpamBrain this looks like doorway pages / low-value duplicates. Recommended fixes (separate task):
- Add 150+ words of unique content per school (pull from school website meta, SALSA narrative, per-school context)
- Consolidate: instead of 1 page per school, make school entries collapsible rows on the kommun page and drop `/skola/[slug]` from the sitemap entirely. That cuts sitemap to ~260 URLs (kommuner + core) — all high-quality, more likely to be fully indexed. Inbound links to school pages still work (dynamicParams would need to be enabled), but they'd be off-sitemap.

### 3. No-authority domain + crawl budget (NOT IN OUR CONTROL)
New domain, few backlinks, Swedish-language niche. Google rations crawling heavily on low-authority domains. Fixing `lastmod` and content quality is the only lever we have internally. External lever: backlinks.

### 4. Internal link discoverability (MINOR)
`/ranking` and `/kommuner` are the two hubs that should fan out to deep pages. Verified they exist and link to kommun pages. School pages are currently only reachable via the kommun page they're on — two clicks from home. That's borderline but acceptable.

## Actions

- [x] **This session**: fix `lastmod` to use stable content-change dates, not deploy timestamps.
- [ ] **User action**: after deploy, in GSC → Sitemaps, remove `sitemap.xml` and resubmit to force a re-fetch. Monitor Coverage report over next 7–14 days.
- [ ] **User action (manual)**: GSC → URL Inspection → request indexing for 5–10 high-value kommun pages (Stockholm, Göteborg, Malmö, Uppsala, Lund). Forces crawl; bypasses sitemap discovery lottery.
- [ ] **Next session (bigger fix)**: evaluate dropping `/skola/[slug]` from sitemap OR beefing up each school page to 150+ unique words. Pick one.
- [ ] **Long-term**: backlinks (directory listings, Swedish parenting forums, reddit /r/sweden posts when data updates).

## What good looks like

In 14 days: GSC shows ≥100 kommun pages indexed (from near-zero), impressions on `bästa skolan i [kommun]` queries expand beyond current 17 top cities, organic clicks rise above current ~50/wk baseline.
