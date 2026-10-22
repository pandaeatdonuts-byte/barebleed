import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(projectRoot, "dist");
const backgroundVideoCdn =
  "https://media.githubusercontent.com/media/pandaeatdonuts-byte/barebleed/main/background.mp4";
const staticFiles = [
  "avatar.png",
  "avatar.gif",
  "cursor.png",
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
const productionHtml = indexHtml.replace(
  'src="background.mp4"',
  `src="${backgroundVideoCdn}"`,
);
await writeFile(resolve(outputDirectory, "index.html"), productionHtml);
