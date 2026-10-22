import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(projectRoot, "dist");
const staticFiles = [
  "avatar.gif",
  "cursor.png",
  "yessirskiii.mp3",
  "yessirskiii-cover.jpg",
  "fell-in-luv.mp3",
  "fell-in-luv-cover.jpg",
  "twig.mp3",
  "twig-cover.png",
  "feel-my-wrath.mp3",
  "feel-my-wrath-cover.png",
  "bastard.mp3",
  "bastard-cover.png",
  "i-keep-calling.mp3",
  "i-keep-calling-cover.png",
  "im-a-piece-of-shit.mp3",
  "im-a-piece-of-shit-cover.png",
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const staticFile of staticFiles) {
  await cp(resolve(projectRoot, staticFile), resolve(outputDirectory, staticFile));
}

const indexHtml = await readFile(resolve(projectRoot, "index.html"), "utf8");
await writeFile(resolve(outputDirectory, "index.html"), indexHtml);
