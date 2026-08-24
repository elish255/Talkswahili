// Talkswahili — TanStack Start + Vercel/Nitro
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Use Nitro's Vercel preset so SSR and generated /assets/* files
  // are deployed and served correctly by Vercel.
  nitro: {
    preset: "vercel",
  },
});
