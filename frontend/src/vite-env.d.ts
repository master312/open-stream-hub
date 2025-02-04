/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REST_API_HOST: string;
  readonly REST_API_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
