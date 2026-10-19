import { gunzipSync, gzipSync, unzipSync, strFromU8, strToU8 } from "fflate";
import { analyseReplay } from "./replay.ts";
import type { StoredGame } from "./types.ts";
const MAX = 48 * 1024 * 1024;
function expand(bytes: Uint8Array): Uint8Array {
  if (bytes[0] !== 31 || bytes[1] !== 139) return bytes;
  if (bytes.length < 18) throw new Error("Fichier gzip incomplet.");
  const size = new DataView(
    bytes.buffer,
    bytes.byteOffset + bytes.length - 4,
    4,
  ).getUint32(0, true);
  if (size > MAX) throw new Error("Replay décompressé trop volumineux.");
  const decoded = gunzipSync(bytes);
  if (decoded.length > MAX) throw new Error("Replay trop volumineux.");
  return decoded;
}
const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export function toBase64(bytes: Uint8Array): string {
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const x =
      (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    output +=
      alphabet[(x >>> 18) & 63] +
      alphabet[(x >>> 12) & 63] +
      (i + 1 < bytes.length ? alphabet[(x >>> 6) & 63] : "=") +
      (i + 2 < bytes.length ? alphabet[x & 63] : "=");
  }
  return output;
}
export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/=+$/, ""),
    output = new Uint8Array(Math.floor((clean.length * 6) / 8));
  let bits = 0,
    value = 0,
    index = 0;
  for (const c of clean) {
    const n = alphabet.indexOf(c);
    if (n < 0) throw new Error("Archive invalide.");
    value = (value << 6) | n;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[index++] = (value >>> bits) & 255;
    }
  }
  return output;
}
export function importReplayBytes(
  bytes: Uint8Array,
  fileName: string,
  depth = 0,
  budget = { bytes: 0, files: 0 },
): StoredGame[] {
  if (depth > 1)
    throw new Error("Les archives imbriquées ne sont pas prises en charge.");
  if (bytes.length > MAX) throw new Error("Ce fichier dépasse 48 Mo.");
  const decoded = expand(bytes);
  if (decoded[0] === 80 && decoded[1] === 75) {
    let total = 0,
      count = 0;
    const entries = unzipSync(decoded, {
      filter: (f) => {
        if (!/\.(replay(?:\.gz)?|json)$/i.test(f.name)) return false;
        total += f.originalSize;
        count++;
        if (total > MAX || count > 100)
          throw new Error(
            "Archive trop volumineuse : maximum 100 replays et 48 Mo décompressés.",
          );
        return true;
      },
    });
    const manifestEntry = Object.entries(entries).find(([name]) =>
      /(^|\/)manifest\.json$/i.test(name),
    );
    const games = Object.entries(entries)
      .filter(([name]) => !/(^|\/)manifest\.json$/i.test(name))
      .flatMap(([name, data]) =>
        importReplayBytes(data, name, depth + 1, budget),
      );
    if (manifestEntry) {
      let manifest: any;
      try {
        manifest = JSON.parse(strFromU8(manifestEntry[1]));
      } catch {
        throw new Error("Manifeste d’archive illisible.");
      }
      if (
        manifest.format === "inksight-archive-v1" &&
        Array.isArray(manifest.notes)
      ) {
        const notes = new Map(
          manifest.notes
            .filter(
              (n: any) =>
                typeof n.id === "string" && typeof n.note === "string",
            )
            .map((n: any) => [n.id, n.note.slice(0, 10000)]),
        );
        games.forEach((g) => {
          g.note = String(notes.get(g.analysis.id) ?? "");
        });
      }
    }
    if (!games.length)
      throw new Error("Aucun fichier de replay trouvé dans cette archive.");
    return games;
  }
  budget.bytes += decoded.length;
  budget.files++;
  if (budget.bytes > MAX || budget.files > 100)
    throw new Error(
      "Archive trop volumineuse : maximum 100 replays et 48 Mo décompressés.",
    );
  let data: unknown;
  try {
    data = JSON.parse(strFromU8(decoded));
  } catch {
    throw new Error(
      "Le contenu du fichier n’est pas un JSON de replay lisible.",
    );
  }
  const analysis = analyseReplay(data, fileName);
  return [
    {
      analysis,
      replayGzip: toBase64(gzipSync(strToU8(JSON.stringify(data)))),
      note: "",
    },
  ];
}
