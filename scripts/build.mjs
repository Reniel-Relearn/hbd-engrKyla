import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const sourceDirectories = ["site", "pictures", "letters", "assets"];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return files.flat();
}

async function createBuildVersion() {
  const files = (await Promise.all([
    ...sourceDirectories.map((directory) => listFiles(resolve(root, directory))),
    Promise.resolve([resolve(root, "scripts", "build.mjs"), resolve(root, "package.json")]),
  ])).flat().sort((a, b) => a.localeCompare(b));
  const hash = createHash("sha256");

  for (const file of files) {
    hash.update(relative(root, file).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(await readFile(file));
    hash.update("\0");
  }

  return hash.digest("hex").slice(0, 12);
}

function versionHtml(html, version) {
  return html.replace(
    /((?:href|src)=["'])(styles\.css|content\.js|app\.js)(["'])/g,
    `$1$2?v=${version}$3`,
  );
}

function versionDynamicAssets(source, version) {
  return source.replace(
    /(["'])((?:pictures|letters|assets)\/[^"'?]+)(["'])/g,
    `$1$2?v=${version}$3`,
  );
}

const buildVersion = await createBuildVersion();

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all([
  cp(resolve(root, "site"), dist, { recursive: true }),
  cp(resolve(root, "pictures"), resolve(dist, "pictures"), { recursive: true }),
  cp(resolve(root, "letters"), resolve(dist, "letters"), { recursive: true }),
  cp(resolve(root, "assets"), resolve(dist, "assets"), { recursive: true }),
]);

const indexPath = resolve(dist, "index.html");
const contentPath = resolve(dist, "content.js");
const appPath = resolve(dist, "app.js");

await Promise.all([
  readFile(indexPath, "utf8").then((source) => writeFile(indexPath, versionHtml(source, buildVersion))),
  readFile(contentPath, "utf8").then((source) => writeFile(contentPath, versionDynamicAssets(source, buildVersion))),
  readFile(appPath, "utf8").then((source) => writeFile(appPath, versionDynamicAssets(source, buildVersion))),
]);

console.log(`Birthday site assembled in dist/ (version ${buildVersion}).`);
