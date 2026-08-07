import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

await mkdir("site-assets", { recursive: true });
await Promise.all([
  copyFile("root-publish/site-assets/app.js", "site-assets/app.js"),
  copyFile("root-publish/site-assets/app.css", "site-assets/app.css"),
  copyFile("public/portfolio-data.json", "portfolio-data.json"),
  copyFile("public/favicon.svg", "favicon.svg"),
  copyFile("public/app-icon.svg", "app-icon.svg"),
  copyFile("public/app-icon-192.png", "app-icon-192.png"),
  copyFile("public/app-icon-512.png", "app-icon-512.png"),
  copyFile("public/app-icon-1024.png", "app-icon-1024.png"),
]);

const [html, js, css] = await Promise.all([
  readFile("root-publish/index.html", "utf8"),
  readFile("root-publish/site-assets/app.js"),
  readFile("root-publish/site-assets/app.css"),
]);
const version = createHash("sha256").update(js).update(css).digest("hex").slice(0, 12);
const versionedHtml = html
  .replace("./site-assets/app.js", `./site-assets/app.js?v=${version}`)
  .replace("./site-assets/app.css", `./site-assets/app.css?v=${version}`);
await writeFile("index.html", versionedHtml, "utf8");
