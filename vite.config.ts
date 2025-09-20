import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const importMetaEnvEntries = Object.entries(env).reduce<Record<string, string>>((acc, [key, value]) => {
      if (!key.startsWith('VITE_')) {
        acc[`import.meta.env.${key}`] = JSON.stringify(value);
      }
      return acc;
    }, {});
    return {
      plugins: [react()],
      define: {
        ...importMetaEnvEntries,
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
