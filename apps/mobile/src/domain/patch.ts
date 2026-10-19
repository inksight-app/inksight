const forbidden = new Set(["__proto__", "prototype", "constructor"]);
const clone = <T>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));
export type Patch = {
  op: string;
  path: string;
  value?: unknown;
  from?: string;
};
function segments(path: string): string[] {
  if (path === "") return [];
  if (!path.startsWith("/")) throw new Error("Chemin de replay invalide.");
  const keys = path
    .slice(1)
    .split("/")
    .map((k) => k.replace(/~1/g, "/").replace(/~0/g, "~"));
  if (keys.length > 40 || keys.some((k) => forbidden.has(k)))
    throw new Error("Chemin de replay non autorisé.");
  return keys;
}
function index(key: string, length: number, add: boolean): number {
  if (add && key === "-") return length;
  if (!/^(0|[1-9]\d*)$/.test(key)) throw new Error("Index de replay invalide.");
  const i = Number(key);
  if (i >= length + Number(add))
    throw new Error("Le replay contient un index absent.");
  return i;
}
function locate(root: any, keys: string[]): any {
  let node = root;
  for (const key of keys) {
    if (node === null || typeof node !== "object" || !Object.hasOwn(node, key))
      throw new Error("Le replay est incomplet : chemin absent.");
    node = node[key];
  }
  return node;
}
// Mutates only this freshly cloned replay. Strict failures prevent plausible but false statistics.
export function applyPatch(
  root: any,
  patch: Patch,
  duelsOptionalFields = false,
): any {
  const keys = segments(patch.path);
  if (["copy", "move"].includes(patch.op)) {
    if (typeof patch.from !== "string")
      throw new Error("Source de patch absente.");
    const fromKeys = segments(patch.from);
    if (
      patch.op === "move" &&
      keys.length > fromKeys.length &&
      fromKeys.every((k, i) => keys[i] === k)
    )
      throw new Error("Déplacement de replay invalide.");
    const value = clone(locate(root, fromKeys));
    if (patch.op === "move")
      root = applyPatch(
        root,
        { op: "remove", path: patch.from },
        duelsOptionalFields,
      );
    return applyPatch(
      root,
      { op: "add", path: patch.path, value },
      duelsOptionalFields,
    );
  }
  if (patch.op === "test") {
    if (JSON.stringify(locate(root, keys)) !== JSON.stringify(patch.value))
      throw new Error("Le contrôle du replay a échoué.");
    return root;
  }
  if (!["add", "remove", "replace"].includes(patch.op))
    throw new Error(`Opération de replay non prise en charge : ${patch.op}`);
  if (!keys.length) {
    if (patch.op === "remove")
      throw new Error("Suppression du replay refusée.");
    return clone(patch.value);
  }
  const parent = locate(root, keys.slice(0, -1));
  const key = keys.at(-1)!;
  if (parent === null || typeof parent !== "object")
    throw new Error("Structure de replay invalide.");
  if (Array.isArray(parent)) {
    const i = index(key, parent.length, patch.op === "add");
    if (patch.op === "add") parent.splice(i, 0, clone(patch.value));
    else if (patch.op === "remove") parent.splice(i, 1);
    else parent[i] = clone(patch.value);
  } else {
    // Duels serializes undefined object properties away, but later replaces/removes them.
    // This compatibility is limited to object leaves: absent parents and invalid array indexes still fail.
    if (
      !duelsOptionalFields &&
      patch.op !== "add" &&
      !Object.hasOwn(parent, key)
    )
      throw new Error("Le replay est incomplet : valeur absente.");
    if (patch.op === "remove") delete parent[key];
    else parent[key] = clone(patch.value);
  }
  return root;
}
