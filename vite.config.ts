import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

function localPortfolioEditor() {
  return {
    name: "local-portfolio-editor",
    configureServer(server: { middlewares: { use: (path: string, handler: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void) => void } }) {
      server.middlewares.use("/api/portfolio", (req, res) => {
        if (req.method === "GET") {
          readFile(resolve(process.cwd(), "public/portfolio-data.json"), "utf8")
            .then(data => { res.setHeader("Content-Type", "application/json"); res.end(data); })
            .catch(() => { res.statusCode = 500; res.end('{"assets":[],"prices":[]}'); });
          return;
        }
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            if (!Array.isArray(data.assets) || !Array.isArray(data.prices)) throw new Error("Invalid data");
            await writeFile(resolve(process.cwd(), "public/portfolio-data.json"), `${JSON.stringify(data, null, 2)}\n`, "utf8");
            res.setHeader("Content-Type", "application/json"); res.end('{"ok":true}');
          } catch { res.statusCode = 400; res.end('{"ok":false}'); }
        });
      });
    },
  };
}

export default defineConfig({
  base: "./",
  root: "source",
  publicDir: false,
  plugins: [react(), localPortfolioEditor()],
  build: {
    outDir: "../root-publish",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "site-assets/app.js",
        assetFileNames: "site-assets/app.[ext]",
        chunkFileNames: "site-assets/[name].js",
      },
    },
  },
});
