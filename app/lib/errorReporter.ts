export const MAX_EVENTS_PER_SESSION = 5;
export const MAX_LABEL_LENGTH = 100;
export const MAX_PATH_LENGTH = 40;

/**
 * Collapse a raw error message to a stable identity.
 *
 * GA4 custom dimensions have a cardinality limit; unbounded strings would push
 * every distinct error into the "(other)" bucket and make the data useless. So
 * anything that varies between two occurrences of the SAME bug is removed:
 * absolute URLs, content-hashed bundle names, and line:column numbers.
 * Ordinary filenames (pop.mp3, analytics.js) are kept — they identify the bug.
 */
export function normalizeMessage(raw: string): string {
  return raw
    .replace(/https?:\/\/[^\s)]+/g, " ")
    .replace(/\b[\w-]*[0-9a-f]{8,}[\w-]*\.(?:js|css|mjs)\b/gi, " ")
    .replace(/:\d+:\d+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build the `event_label` payload: path first, so truncation never costs us the location. */
export function buildLabel(path: string, message: string): string {
  const shortPath = path.slice(0, MAX_PATH_LENGTH);
  return `${shortPath}|${normalizeMessage(message)}`.slice(0, MAX_LABEL_LENGTH);
}

/**
 * Build the message for a failed resource load (img/script/link).
 *
 * Resource `error` events only carry a URL, not a message, so the message is
 * synthesized here: the tag plus the URL's pathname (falling back to the raw
 * URL when it can't be parsed as an absolute URL, e.g. a relative path).
 */
export function buildResourceMessage(tag: string, url: string): string {
  let resourcePath = url;
  try {
    resourcePath = new URL(url).pathname;
  } catch {
    // relative or empty URL — use it as-is
  }
  return `resource-failed ${tag} ${resourcePath}`;
}

/** Build the message for an unhandled promise rejection from its (untyped) reason. */
export function buildRejectionMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

/** Per-session send budget: dedupes identical labels and caps total volume. */
export function createErrorBudget(max: number = MAX_EVENTS_PER_SESSION) {
  const seen = new Set<string>();
  let sent = 0;
  return {
    shouldSend(label: string): boolean {
      if (sent >= max) return false;
      if (seen.has(label)) return false;
      seen.add(label);
      sent += 1;
      return true;
    },
  };
}
