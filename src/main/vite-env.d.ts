// vite-env.d.ts
interface ImportMetaEnv {
  MAIN_VITE_SUPABASE_URL: string;
  MAIN_VITE_SUPABASE_ANON_KEY: string;
  MAIN_VITE_ENCRYPTION_KEY: string;
  // Add other environment variables here as needed
}

// This is useful for better type checking if your project doesn't use `vite` yet
interface ImportMeta {
  env: ImportMetaEnv;
}
