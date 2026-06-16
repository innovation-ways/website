// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://innovation-ways.com',
  // Dev/preview only: allow access via the dev-box hostname (e.g. iw-dev-01) over LAN/Tailscale.
  // No effect on the static production build Cloudflare serves.
  server: {
    allowedHosts: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
