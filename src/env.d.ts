/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly CF_PAGES_BRANCH?: string;
  readonly CF_PAGES_URL?: string;
  readonly CF_PAGES_COMMIT_SHA?: string;
  readonly BUILD_COMMIT_TIME?: string;
  readonly BUILD_TREE_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
