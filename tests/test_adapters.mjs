import fs from "node:fs";
import { toSVG, toPrompt } from "../packages/uin-adapters/source/index.js";

const sample = JSON.parse(fs.readFileSync(new URL("./fixtures/sample_uin_v08.json", import.meta.url), "utf8"));
const svg = toSVG(sample);
if (!svg.includes("<svg") || svg.includes("NaN")) throw new Error("SVG adapter produced invalid output");
const prompt = toPrompt(sample);
if (typeof prompt !== "string" || !prompt.length) throw new Error("Prompt adapter produced no output");
console.log("Adapter integration: OK");
