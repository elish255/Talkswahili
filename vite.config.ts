// @lovable.dev/vite-tanstack-config already provides TanStack Start,
// React, Tailwind, tsconfig paths and the Vercel/Nitro integration.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // IMPORTANT: do not override nitro.output.publicDir on Vercel.
  // The Vercel preset must own the static output location so hashed
  // CSS/JS assets under /assets/* are uploaded to Vercel's static layer.
});
