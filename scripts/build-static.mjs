import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(projectRoot, "dist");
const staticFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "avatar.gif",
  "cursor.png",
  "music/yessirskiii.mp3",
  "music/yessirskiii-cover.jpg",
  "music/marble-floors.mp3",
  "music/marble-floors-cover.jpg",
  "music/fell-in-luv.mp3",
  "music/fell-in-luv-cover.jpg",
  "music/twig.mp3",
  "music/twig-cover.png",
  "music/feel-my-wrath.mp3",
  "music/feel-my-wrath-cover.png",
  "music/bastard.mp3",
  "music/bastard-cover.png",
  "music/i-keep-calling.mp3",
  "music/i-keep-calling-cover.png",
  "music/im-a-piece-of-shit.mp3",
  "music/im-a-piece-of-shit-cover.png",
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const staticFile of staticFiles) {
  await cp(resolve(projectRoot, staticFile), resolve(outputDirectory, staticFile));
}
