import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Manually define the process type to avoid issues when @types/node is not installed.
declare const process: {
  cwd: () => string;
  env: Record<string, string | undefined>;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env': env
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      }
    }
  }
})