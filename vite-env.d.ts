/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_OPENWEATHER_API_KEY?: string;
  readonly VITE_TRANSITLAND_API_KEY?: string;
  readonly VITE_OTP_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
