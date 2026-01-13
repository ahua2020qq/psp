/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VOLC_ACCESS_KEY: string
  readonly VITE_DEEPSEEK_API_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}