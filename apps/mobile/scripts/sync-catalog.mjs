import { writeFile, mkdir } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
const rows = [];
for (let set = 1; set <= 14; set++) {
  const response = await fetch(`https://api.lorcast.com/v0/sets/${set}/cards`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(`Lorcast set ${set}: HTTP ${response.status}`);
  const cards = await response.json();
  if (!Array.isArray(cards) || !cards.length)
    throw new Error(`Catalogue vide pour le set ${set}`);
  for (const c of cards)
    rows.push({
      id: `${set}-${c.collector_number}`,
      name: [c.name, c.version].filter(Boolean).join(" — "),
      canonical: [c.name, c.version]
        .filter(Boolean)
        .join(" — ")
        .normalize("NFKC")
        .toLowerCase(),
      set,
      number: String(c.collector_number),
      cost: c.cost,
      inkable: c.inkwell,
      colors: c.inks ?? [c.ink].filter(Boolean),
      type: c.type ?? [],
      text: c.text ?? "",
      strength: c.strength,
      willpower: c.willpower,
      lore: c.lore,
      image: c.image_uris?.digital?.small ?? null,
      lang: c.lang,
    });
  console.log(`Set ${set}: ${cards.length} impressions`);
  await setTimeout(150);
}
const output = {
  source: "https://api.lorcast.com/v0",
  fetchedAt: new Date().toISOString(),
  language: "en",
  corePolicy: {
    source: "https://duels.ink/release-notes/2026-10-08-set-14-release",
    fromSet: 9,
    toSet: 14,
  },
  cards: rows,
};
await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../src/data/catalog.json", import.meta.url),
  JSON.stringify(output),
);
console.log(
  `${rows.length} impressions, ${new Set(rows.map((c) => c.canonical)).size} cartes distinctes`,
);
