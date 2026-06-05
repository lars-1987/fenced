/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  /** PostHog project key. Analytics is a no-op when unset. */
  readonly VITE_POSTHOG_KEY?: string;
  /** PostHog API host. Defaults to https://us.i.posthog.com. */
  readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
