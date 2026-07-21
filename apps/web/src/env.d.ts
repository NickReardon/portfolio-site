/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly CF_PAGES?: string;
  readonly CF_PAGES_BRANCH?: string;
  readonly CF_PAGES_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
