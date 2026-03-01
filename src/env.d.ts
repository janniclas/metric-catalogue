/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEATURE_AUTH_PROPOSE_METRIC?: string;
  readonly VITE_GITHUB_CLIENT_ID?: string;
  readonly VITE_OAUTH_EXCHANGE_URL?: string;
  readonly VITE_OAUTH_REDIRECT_URI?: string;
  readonly VITE_REPO_URL?: string;
  readonly VITE_REPO_BRANCH?: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
