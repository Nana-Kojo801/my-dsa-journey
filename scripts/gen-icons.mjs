import sharp from "sharp";
import { readFileSync } from "fs";

const favicon = readFileSync(new URL("../public/favicon.svg", import.meta.url));
const badge = readFileSync(new URL("../public/badge-source.svg", import.meta.url));

await sharp(favicon, { density: 384 }).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(favicon, { density: 384 }).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(favicon, { density: 384 }).resize(512, 512).png().toFile("public/icon-maskable-512.png");
await sharp(badge, { density: 384 }).resize(96, 96).png().toFile("public/badge-96.png");

console.log("icons generated");
