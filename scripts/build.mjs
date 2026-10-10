import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all([
  cp(resolve(root, "site"), dist, { recursive: true }),
  cp(resolve(root, "pictures"), resolve(dist, "pictures"), { recursive: true }),
  cp(resolve(root, "letters"), resolve(dist, "letters"), { recursive: true }),
  cp(resolve(root, "assets"), resolve(dist, "assets"), { recursive: true }),
]);

console.log("Birthday site assembled in dist/.");
