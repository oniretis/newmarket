import { defineNitroConfig } from "nitropack";

export default defineNitroConfig({
  preset: "cloudflare",
  output: {
    dir: "./dist",
    serverDir: "./dist/server",
    publicDir: "./dist/client",
  },
  runtimeConfig: {
    // Add any runtime config here
  },
});
