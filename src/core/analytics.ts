/**
 * Privacy-first analytics.
 *
 * PostHog in cookieless mode. It only loads when ALL of these hold:
 *   - a project key is configured at build time,
 *   - the visitor has not set Do Not Track or Global Privacy Control,
 *   - the visitor has not opted out on this device.
 *
 * When disabled, posthog-js is never even fetched (dynamic import), so a
 * blocked visitor downloads zero analytics bytes. No cookies, no persistent
 * identifiers, no autocapture, no session recording, and never any document
 * content. We send a handful of anonymous product events and nothing more.
 */
const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

const OPT_OUT_KEY = "fenced:analytics-opt-out";

/** True if the browser signals Do Not Track or Global Privacy Control. */
function privacySignalsOptOut(): boolean {
  const dnt =
    navigator.doNotTrack === "1" ||
    navigator.doNotTrack === "yes" ||
    (window as unknown as { doNotTrack?: string }).doNotTrack === "1";
  const gpc = (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  return dnt || gpc;
}

/** True if the visitor flipped the on-device opt-out on the privacy page. */
export function hasOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist an on-device opt-out choice. Disabling does not undo a DNT/GPC signal. */
export function setOptedOut(value: boolean): void {
  try {
    if (value) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    /* storage unavailable; nothing to persist */
  }
}

/** Whether analytics is allowed to run right now. */
export function analyticsEnabled(): boolean {
  return Boolean(KEY) && !privacySignalsOptOut() && !hasOptedOut();
}

type PostHog = typeof import("posthog-js").default;
let ph: PostHog | null = null;

/** Initialise analytics if allowed. Safe to call once on boot. */
export async function initAnalytics(): Promise<void> {
  if (!analyticsEnabled()) return;
  const { default: posthog } = await import("posthog-js");
  posthog.init(KEY as string, {
    api_host: HOST,
    persistence: "memory", // cookieless: nothing stored, no identifiers
    autocapture: false, // no DOM/input capture
    capture_pageview: true,
    capture_pageleave: false,
    disable_session_recording: true,
    respect_dnt: true,
    // We render Markdown the visitor pastes; never let PostHog read it.
    mask_all_text: true,
    mask_all_element_attributes: true,
  });
  ph = posthog;
}

/** Track an anonymous product event. No-op when analytics is disabled. */
export function track(event: string, props?: Record<string, string | number | boolean>): void {
  ph?.capture(event, props);
}
