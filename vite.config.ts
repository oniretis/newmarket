import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const config = defineConfig({
  esbuild: {
    logOverride: {
      "ignored-bare-import": "silent",
    },
    keepNames: true,
    minify: false, // Disable minification for debugging
    target: "esnext",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only apply manual chunks to client-side code
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack/react-router') || id.includes('@tanstack/react-start')) {
              return 'router';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('input-otp')) {
              return 'otp';
            }
            if (id.includes('tailwind-merge') || id.includes('clsx') || id.includes('date-fns')) {
              return 'utils';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'input-otp'],
  },
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // Plugin to generate Cloudflare Workers entry point
    {
      name: 'generate-cf-worker-entry',
      writeBundle() {
        const workerContent = `import server from './server.js';

// Cloudflare Workers expects a fetch handler as the default export
export default {
  fetch: server.fetch
};`;
        
        const workerPath = 'dist/server/worker.js';
        
        // Ensure directory exists
        try {
          mkdirSync(dirname(workerPath), { recursive: true });
        } catch (error) {
          // Directory might already exist, ignore error
        }
        
        writeFileSync(workerPath, workerContent);
      }
    }
  ],
});

export default config;
