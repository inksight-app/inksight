import data from "../data/catalog.json";
export type CatalogCard = (typeof data.cards)[number];
export const catalog = data;
export function cardPool(coreOnly: boolean): CatalogCard[] {
  const byName = new Map<string, CatalogCard>();
  for (const card of data.cards) {
    if (coreOnly && (card.set < 9 || card.set > 14)) continue;
    const previous = byName.get(card.canonical);
    if (!previous || card.set > previous.set) byName.set(card.canonical, card);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}
export const coreCards = cardPool(true),
  allCards = cardPool(false);
const byId = new Map(data.cards.map((card) => [card.id, card]));
export function cardName(id: string) {
  return byId.get(id)?.name ?? id;
}
