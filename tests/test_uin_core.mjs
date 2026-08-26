import fs from "node:fs";
import { validateUIN } from "../packages/uin-core/src/index.js";

const sample = JSON.parse(fs.readFileSync(new URL("./fixtures/sample_uin_v08.json", import.meta.url), "utf8"));
if (!validateUIN(sample)) throw new Error("UIN sample did not validate");
console.log("UIN core sample validation: OK");
