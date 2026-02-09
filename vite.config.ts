import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  esbuild: {
    logOverride: {
      "ignored-bare-import": "silent",
    },
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
    include: ['react', 'react-dom'],
  },
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
