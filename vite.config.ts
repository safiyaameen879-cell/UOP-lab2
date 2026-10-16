import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  server: { host: true, port: 8080 },
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      // Use src/server.ts as the server entry (SSR error wrapper).
      server: { entry: "server" },
    }),
    // Nitro is only needed to produce the production server bundle.
    ...(command === "build" ? [nitro()] : []),
    viteReact(),
    tailwindcss(),
  ],
}));
