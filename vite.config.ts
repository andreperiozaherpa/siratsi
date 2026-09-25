import vinext from 'vinext';
import { defineConfig } from 'vite';

// MySQL and local attachment storage require the Node.js runtime, rather than
// Cloudflare Worker bindings.
export default defineConfig({
  plugins: [vinext()],
  // mysql2 is a Node.js driver. Keep it out of Vite's inlined SSR module
  // evaluator, which otherwise reuses its CommonJS `module` binding.
  ssr: { external: ['mysql2', 'mysql2/promise'] },
  server: {
    watch: { ignored: ['**/.sites-runtime/**', '**/.wrangler/**', '**/storage/**'] },
  },
});
