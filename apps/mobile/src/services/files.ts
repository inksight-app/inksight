import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { zipSync, strToU8 } from "fflate";
import { fromBase64, importReplayBytes } from "../domain/files";
import type { StoredGame } from "../domain/types";
export async function pickFiles(): Promise<
  { name: string; bytes: Uint8Array }[]
> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  const files = [];
  for (const asset of result.assets) {
    if (asset.size && asset.size > 48 * 1024 * 1024)
      throw new Error("Un fichier dépasse la limite de 48 Mo.");
    const bytes =
      Platform.OS === "web" && asset.file
        ? new Uint8Array(await asset.file.arrayBuffer())
        : await new File(asset.uri).bytes();
    files.push({ name: asset.name, bytes });
  }
  return files;
}
export async function pickReplays(): Promise<StoredGame[]> {
  const files = await pickFiles();
  return files.flatMap((f) => importReplayBytes(f.bytes, f.name));
}
export async function exportArchive(games: StoredGame[]) {
  if (!games.length)
    throw new Error("Importe une partie avant de créer une archive.");
  const entries: Record<string, Uint8Array> = {};
  games.forEach((g, index) => {
    entries[`partie-${index + 1}.replay.gz`] = fromBase64(g.replayGzip);
  });
  entries["manifest.json"] = strToU8(
    JSON.stringify({
      format: "inksight-archive-v1",
      createdAt: new Date().toISOString(),
      notes: games.map((g) => ({ id: g.analysis.id, note: g.note })),
    }),
  );
  const bytes = zipSync(entries, { level: 0 });
  if (Platform.OS === "web") {
    const blob = new Blob([Uint8Array.from(bytes).buffer], {
      type: "application/zip",
    });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "inksight-replays.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } else {
    const file = new File(Paths.cache, "inksight-replays.zip");
    file.create({ overwrite: true });
    file.write(bytes);
    if (!(await Sharing.isAvailableAsync()))
      throw new Error(
        "Le partage de fichiers est indisponible sur cet appareil.",
      );
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/zip",
      UTI: "public.zip-archive",
    });
  }
}
