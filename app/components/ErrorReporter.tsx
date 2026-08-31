"use client";

import { useEffect } from "react";
import {
  buildLabel,
  buildRejectionMessage,
  buildResourceMessage,
  createErrorBudget,
} from "../lib/errorReporter";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function ErrorReporter() {
  useEffect(() => {
    const budget = createErrorBudget();

    const send = (message: string, fatal: boolean) => {
      if (!message) return;
      const label = buildLabel(window.location.pathname, message);
      if (!budget.shouldSend(label)) return;
      // `fatal` is stored by GA4 but is not queryable without registering a
      // custom dimension; we deliberately do not require one. Severity is
      // derived downstream from occurrence counts instead.
      window.gtag?.("event", "exception", { event_label: label, fatal });
    };

    const onError = (event: ErrorEvent) => {
      send(event.message || String(event.error ?? ""), true);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      send(buildRejectionMessage(event.reason), false);
    };

    // Resource load failures (img/script/link) do not bubble, so they are only
    // observable in the capture phase. This same listener also sees script
    // errors, which `onError` already handles — hence the tagName guard.
    const onResourceError = (event: Event) => {
      if (event.target === window) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      // The cast above is a type assertion, not a runtime guarantee: an
      // `error` event's target can be a non-Element EventTarget (e.g. a
      // Document), which has no `tagName` at all. Without `?.` that throws
      // inside the handler instead of being safely ignored.
      const tag = target.tagName?.toLowerCase();
      if (tag !== "img" && tag !== "script" && tag !== "link") return;
      const url =
        (target as HTMLImageElement).src || (target as HTMLLinkElement).href || "";
      send(buildResourceMessage(tag, url), false);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onResourceError, true);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onResourceError, true);
    };
  }, []);

  return null;
}
