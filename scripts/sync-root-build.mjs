import { copyFile, mkdir } from "node:fs/promises";

await mkdir("site-assets", { recursive: true });
await Promise.all([
  copyFile("root-publish/index.html", "index.html"),
  copyFile("root-publish/site-assets/app.js", "site-assets/app.js"),
  copyFile("root-publish/site-assets/app.css", "site-assets/app.css"),
  copyFile("public/portfolio-data.json", "portfolio-data.json"),
  copyFile("public/favicon.svg", "favicon.svg"),
  copyFile("public/app-icon.svg", "app-icon.svg"),
  copyFile("public/app-icon-192.png", "app-icon-192.png"),
  copyFile("public/app-icon-512.png", "app-icon-512.png"),
  copyFile("public/app-icon-1024.png", "app-icon-1024.png"),
]);
