import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // If you deploy to a GitHub Pages *project* site (https://user.github.io/repo/),
  // uncomment and set this to your repo name:
  // base: '/vision-live/',
});
