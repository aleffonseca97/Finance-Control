import { readFile, writeFile } from "node:fs/promises";
import map from "./en-it-map.mjs";

const inputPath = new URL("../messages/en.json", import.meta.url);
const outputPath = new URL("../messages/it.json", import.meta.url);
const english = JSON.parse(await readFile(inputPath, "utf8"));
let untranslated = 0;

const translate = (value) => {
  if (typeof value === "string") {
    if (Object.hasOwn(map, value)) return map[value];
    untranslated += 1;
    return value;
  }

  if (Array.isArray(value)) return value.map(translate);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, translate(child)]),
    );
  }

  return value;
};

const italian = translate(english);
italian.settings.language.it = "Italiano";
italian.settings.language.en = "English";
italian.settings.language.ptBR = "Portoghese (Brasile)";

await writeFile(outputPath, `${JSON.stringify(italian, null, 2)}\n`);
console.log(`Untranslated strings: ${untranslated}`);
console.log(`Italian messages written to ${outputPath.pathname}`);
