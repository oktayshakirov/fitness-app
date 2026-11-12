import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import {
  checkForUpdate,
  loadContent,
  rejectRelease,
  type Bundled,
  type LoadedContent,
  type UpdateIO,
  type UpdateResult,
} from "./remote";

/** Downloaded releases live in documents, so the OS never evicts them. */
const root = () => new Directory(Paths.document, "content");
const at = (path: string) => new File(root(), path);

const io: UpdateIO = {
  exists: (path) => at(path).exists,
  readText: (path) => at(path).textSync(),
  async fetchText(url) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 15_000);
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: abort.signal,
      });
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return await response.text();
    } finally {
      clearTimeout(timer);
    }
  },
  async download(url, dest) {
    await File.downloadFileAsync(url, at(dest), { idempotent: true });
  },
  size: (path) => at(path).size,
  sha256: (path) => at(path).digest("SHA-256"),
  writeText: (path, text) => at(path).writeSync(text),
  move: (from, to) => at(from).moveSync(at(to), { overwrite: true }),
  remove: (path) => {
    const file = at(path);
    if (file.exists) file.delete();
  },
  list: (dir) => {
    const d = new Directory(root(), dir);
    return d.exists ? d.list().map((entry) => entry.name) : [];
  },
  mkdir: (dir) =>
    new Directory(root(), dir).create({
      intermediates: true,
      idempotent: true,
    }),
};

const supported = Platform.OS === "ios" || Platform.OS === "android";

/** The active release on a phone; the bundle on web or if anything goes wrong. */
export function loadDeviceContent(bundled: Bundled): LoadedContent {
  if (supported)
    try {
      return loadContent(io, bundled, (path) => at(path).uri);
    } catch {
      // loadContent already falls back; this only guards native module errors.
    }
  return loadContent(
    { exists: () => false, readText: () => "{}" },
    bundled,
    () => "",
  );
}

let running: Promise<UpdateResult> | null = null;

/** One check at a time; skipped where there is no file system or no host. */
export function checkDeviceUpdate(
  bundled: Bundled,
  config: { baseUrl: string; interval: number; retry?: number; force?: boolean },
): Promise<UpdateResult> {
  if (!supported) return Promise.resolve({ status: "current" });
  running ??= checkForUpdate(io, bundled, {
    ...config,
    now: Date.now(),
  }).finally(() => {
    running = null;
  });
  return running;
}

/** Turns off the downloaded release this session runs on; the bundle applies at the next start. */
export function rejectRunningRelease(version: string) {
  if (supported) rejectRelease(io, version);
}
