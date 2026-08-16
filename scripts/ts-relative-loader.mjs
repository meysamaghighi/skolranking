/**
 * Minimal Node ESM loader hook so `scripts/verify-regional-join.mjs` can
 * `import()` `app/lib/gymnasium-regional.ts` directly and get the SAME code
 * the Next.js app runs -- no duplicated matching/aggregation logic in a
 * second, driftable copy.
 *
 * Why this exists: Node (v22.6+/v25 here) strips TypeScript types natively
 * with no build step, but plain ESM module resolution requires an explicit
 * file extension on relative specifiers -- it does not do the
 * bundler-style "try appending .ts" probing that Next.js's own resolver
 * (moduleResolution: "bundler" in tsconfig.json) does. `app/lib/*.ts` files
 * import each other with extensionless specifiers (the project-wide
 * convention, required by Next's bundler) so a plain `node --import` would
 * fail with ERR_MODULE_NOT_FOUND on the very first relative import. This
 * hook bridges that gap for verification-script purposes only -- it does
 * not touch, and is never loaded by, the actual Next.js app.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  if (isRelative && !path.extname(specifier) && context.parentURL) {
    let parentPath;
    try {
      parentPath = fileURLToPath(context.parentURL);
    } catch {
      parentPath = null;
    }
    if (parentPath) {
      const candidate = path.join(path.dirname(parentPath), `${specifier}.ts`);
      if (existsSync(candidate)) {
        return nextResolve(`${specifier}.ts`, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
