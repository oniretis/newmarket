import { defineNitroConfig } from "nitropack";

export default defineNitroConfig({
  preset: "cloudflare",
  output: {
    publicDir: "./dist/client",
  },
});
