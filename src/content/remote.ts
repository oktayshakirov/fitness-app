/**
 * Remote content releases: check, download, verify, stage and load.
 *
 * Hosting layout (written by fitness-automation core/publish.py):
 *   <base>/current.json            pointer, switched last by the publisher
 *   <base>/<version>/content.json  release envelope
 *   <base>/<version>/<asset.path>  media, each with bytes + sha256
 *
 * On device everything lives under one root directory:
 *   files/<sha256>.<ext>    verified media, shared across releases
 *   releases/<version>.json verified content.json, sanitized
 *   releases/<version>.hits.json  tap polygons for its hit-region SVGs
 *   state.json              { active, previous, lastCheck, rejected }, replaced atomically
 *   tmp/                    in-flight downloads
 *
 * A staged release is only read at the next JS start, so screens never see
 * content change under them. Startup falls back active → previous → bundled.
 * No Expo imports here: the IO is injected so node tests can drive it.
 */
import {
  equipmentCategories,
  muscleIds,
  type CameraView,
  type ContentRelease,
  type MediaAsset,
  type MediaSource,
  type Model,
  type Muscle,
} from "./types";

/** The content schema this app build understands. */
export const APP_SCHEMA = 1;

export type HitRegions = Record<string, Partial<Record<Muscle, number[][]>>>;

export interface Pointer {
  schemaVersion: number;
  minAppSchema: number;
  contentVersion: string;
  content: { path: string; bytes: number; sha256: string };
}

export interface State {
  active: string | null;
  previous: string | null;
  lastCheck: number;
  /** A version the user turned off because it broke a screen; never fetched again. */
  rejected: string | null;
}

/** Synchronous reads used at startup, before the first screen renders. */
export interface SyncIO {
  exists(path: string): boolean;
  readText(path: string): string;
}

export interface UpdateIO extends SyncIO {
  /** Response body of a GET, throwing on a non-2xx status. */
  fetchText(url: string): Promise<string>;
  /** Saves a GET's body to `dest`, replacing it; throws on a non-2xx status. */
  download(url: string, dest: string): Promise<void>;
  size(path: string): number;
  sha256(path: string): Promise<string>;
  writeText(path: string, text: string): void;
  /** Rename within the root; replaces `to`. */
  move(from: string, to: string): void;
  remove(path: string): void;
  list(dir: string): string[];
  mkdir(dir: string): void;
}

export interface Bundled {
  release: ContentRelease;
  hits: HitRegions;
  /** Metro asset ids keyed by the bundled release's asset path. */
  assets: Record<string, number>;
}

export interface UpdateConfig {
  /** Hosting base URL ending in "/". */
  baseUrl: string;
  /** Minimum time between network checks, in milliseconds. */
  interval: number;
  /** After a failed check (offline, host down), the next one may run this soon. Defaults to interval. */
  retry?: number;
  now: number;
  force?: boolean;
}

export type UpdateResult =
  | { status: "throttled" | "current" | "incompatible" }
  | { status: "staged"; version: string | null; downloaded: number }
  | { status: "failed"; error: string };

const models: Model[] = ["male", "female"];
const views: CameraView[] = [
  "front",
  "side",
  "threeq",
  "back",
  "foot",
  "rear",
  "top",
];
/** Relative, no "." or ".." segments, ends in an extension. */
const safe = (path: string) =>
  path.split("/").every((part) => /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(part)) &&
  /\.[A-Za-z0-9]+$/.test(path);
const sha256Hex = /^[0-9a-f]{64}$/;

// ---------- parsing and validation ----------

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function fail(message: string): never {
  throw new Error(message);
}

const strings = (v: unknown, what: string) =>
  Array.isArray(v) && v.every((s) => typeof s === "string")
    ? (v as string[])
    : fail(`${what} must be a list of strings`);

export function parsePointer(text: string): Pointer {
  const p: unknown = JSON.parse(text);
  if (!isObject(p) || !isObject(p.content)) fail("current.json is malformed");
  const { schemaVersion, minAppSchema, contentVersion, content } = p;
  if (
    typeof schemaVersion !== "number" ||
    typeof minAppSchema !== "number" ||
    typeof contentVersion !== "string" ||
    typeof content.path !== "string" ||
    typeof content.bytes !== "number" ||
    typeof content.sha256 !== "string" ||
    !safe(content.path) ||
    !sha256Hex.test(content.sha256)
  )
    fail("current.json is malformed");
  return {
    schemaVersion,
    minAppSchema,
    contentVersion,
    content: {
      path: content.path,
      bytes: content.bytes,
      sha256: content.sha256,
    },
  };
}

export const compatible = (p: {
  schemaVersion: number;
  minAppSchema: number;
}) => p.schemaVersion === APP_SCHEMA && p.minAppSchema <= APP_SCHEMA;

function asset(v: unknown, what: string): MediaAsset {
  if (
    !isObject(v) ||
    typeof v.path !== "string" ||
    !safe(v.path) ||
    typeof v.sha256 !== "string" ||
    !sha256Hex.test(v.sha256) ||
    typeof v.bytes !== "number" ||
    v.bytes <= 0 ||
    typeof v.width !== "number" ||
    typeof v.height !== "number"
  )
    fail(`${what} is not a valid media asset`);
  return {
    path: v.path,
    width: v.width,
    height: v.height,
    bytes: v.bytes,
    sha256: v.sha256,
  };
}

/**
 * Checks the shape screens rely on and drops what this build does not know
 * (unknown muscles, models, views, equipment categories, extra fields), so a
 * newer publisher never crashes an older app. Throws when something required
 * is missing or invalid.
 */
export function parseRelease(text: string): ContentRelease {
  const r: unknown = JSON.parse(text);
  if (!isObject(r)) fail("content.json is malformed");
  if (typeof r.schemaVersion !== "number" || typeof r.minAppSchema !== "number")
    fail("content.json has no schema version");
  if (
    !compatible({
      schemaVersion: r.schemaVersion,
      minAppSchema: r.minAppSchema,
    })
  )
    fail("content.json needs a newer app");
  if (typeof r.contentVersion !== "string") fail("content.json has no version");
  if (!Array.isArray(r.exercises) || r.exercises.length === 0)
    fail("content.json has no exercises");
  const known = (list: string[]) =>
    list.filter((m): m is Muscle =>
      (muscleIds as readonly string[]).includes(m),
    );
  const ids = new Set<string>();
  const exercises = r.exercises.map((e: unknown, i) => {
    if (!isObject(e) || typeof e.id !== "string" || typeof e.name !== "string")
      fail(`exercise ${i} has no id or name`);
    if (ids.has(e.id)) fail(`duplicate exercise ${e.id}`);
    ids.add(e.id);
    const media: ContentRelease["exercises"][number]["media"] = {};
    if (isObject(e.media))
      for (const model of models) {
        const byView = e.media[model];
        if (!isObject(byView)) continue;
        for (const view of views) {
          const v = byView[view];
          if (!isObject(v)) continue;
          (media[model] ??= {})[view] = {
            video: asset(v.video, `${e.id} ${model} ${view} video`),
            poster: asset(v.poster, `${e.id} ${model} ${view} poster`),
          };
        }
      }
    if (!media.male && !media.female) fail(`${e.id} has no media`);
    const primary = known(strings(e.primary, `${e.id} primary`));
    if (!primary.length) fail(`${e.id} has no known primary muscle`);
    return {
      id: e.id,
      name: e.name,
      primary,
      secondary: known(strings(e.secondary ?? [], `${e.id} secondary`)),
      equipment: strings(e.equipment ?? [], `${e.id} equipment`),
      steps: strings(e.steps, `${e.id} steps`),
      cues: strings(e.cues ?? [], `${e.id} cues`),
      mistakes: strings(e.mistakes ?? [], `${e.id} mistakes`),
      breathing: typeof e.breathing === "string" ? e.breathing : "",
      source: typeof e.source === "string" ? e.source : "",
      media,
    };
  });
  const bodymap: ContentRelease["bodymap"] = {};
  if (isObject(r.bodymap))
    for (const model of models) {
      const sides = r.bodymap[model];
      if (!isObject(sides)) continue;
      for (const side of ["front", "back"] as const) {
        const b = sides[side];
        if (!isObject(b)) continue;
        const masks: Partial<Record<Muscle, MediaAsset>> = {};
        if (isObject(b.masks))
          for (const m of muscleIds)
            if (b.masks[m])
              masks[m] = asset(b.masks[m], `${model} ${side} ${m} mask`);
        (bodymap[model] ??= {})[side] = {
          base: asset(b.base, `${model} ${side} body`),
          masks,
          hitRegions: asset(b.hitRegions, `${model} ${side} hit regions`),
        };
      }
    }
  if (!Object.keys(bodymap).length) fail("content.json has no body views");
  const heroes: ContentRelease["heroes"] = {};
  if (isObject(r.heroes))
    for (const model of models)
      if (r.heroes[model])
        heroes[model] = asset(r.heroes[model], `${model} hero`);
  const release: ContentRelease = {
    schemaVersion: 1,
    minAppSchema: r.minAppSchema,
    contentVersion: r.contentVersion,
    exercises,
    bodymap,
    heroes,
    attribution: typeof r.attribution === "string" ? r.attribution : "",
  };
  if (isObject(r.equipmentIcons)) {
    const icons: NonNullable<ContentRelease["equipmentIcons"]> = {};
    for (const c of equipmentCategories) {
      const v = r.equipmentIcons[c];
      if (isObject(v))
        icons[c] = {
          icon: asset(v.icon, `${c} icon`),
          equipment: strings(v.equipment, `${c} equipment`),
        };
    }
    release.equipmentIcons = icons;
  }
  return release;
}

/** Every media asset in a release, hit-region SVGs included. */
export function* releaseAssets(node: unknown): Generator<MediaAsset> {
  if (Array.isArray(node)) for (const v of node) yield* releaseAssets(v);
  else if (isObject(node)) {
    if (typeof node.sha256 === "string" && typeof node.path === "string")
      yield node as unknown as MediaAsset;
    else for (const v of Object.values(node)) yield* releaseAssets(v);
  }
}

/** "v0.10.0" > "v0.9.2"; non-numeric parts compare as text. */
export function compareVersions(a: string, b: string) {
  const parts = (v: string) => v.replace(/^v/, "").split(/[.-]/);
  const [pa, pb] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const [x = "0", y = "0"] = [pa[i], pb[i]];
    const [nx, ny] = [Number(x), Number(y)];
    const d =
      Number.isNaN(nx) || Number.isNaN(ny) ? x.localeCompare(y) : nx - ny;
    if (d) return Math.sign(d);
  }
  return 0;
}

/** Same conversion as scripts/import_release.py: M/L/Z paths → polygon rings. */
export function hitRegionsFromSvg(svg: string) {
  if (!svg.includes('viewBox="0 0 800 1000"'))
    fail("hit regions are not 800×1000");
  const regions: Partial<Record<Muscle, number[][]>> = {};
  for (const [, id, d] of svg.matchAll(
    /<path[^>]*\bid="([a-z_]+)"[^>]*\bd="([^"]+)"/g,
  )) {
    if (/[^MLZz\d\s,.-]/.test(d!))
      fail(`hit region ${id} uses unsupported commands`);
    if (!(muscleIds as readonly string[]).includes(id!)) continue;
    regions[id as Muscle] = d!
      .split(/[Zz]/)
      .filter((ring) => ring.trim())
      .map((ring) => (ring.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number));
  }
  if (!Object.keys(regions).length) fail("hit regions are empty");
  return regions;
}

// ---------- on-device store ----------

const STATE = "state.json";
const extension = (path: string) => path.slice(path.lastIndexOf("."));
export const filePath = (a: MediaAsset) =>
  `files/${a.sha256}${extension(a.path)}`;
const releaseFile = (v: string) => `releases/${encodeURIComponent(v)}.json`;
const hitsFile = (v: string) => `releases/${encodeURIComponent(v)}.hits.json`;

export function readState(io: SyncIO): State {
  try {
    const s = JSON.parse(io.readText(STATE));
    return {
      active: typeof s.active === "string" ? s.active : null,
      previous: typeof s.previous === "string" ? s.previous : null,
      lastCheck: typeof s.lastCheck === "number" ? s.lastCheck : 0,
      rejected: typeof s.rejected === "string" ? s.rejected : null,
    };
  } catch {
    return { active: null, previous: null, lastCheck: 0, rejected: null };
  }
}

function writeState(io: UpdateIO, state: State) {
  io.writeText("tmp/state.json", JSON.stringify(state));
  io.move("tmp/state.json", STATE);
}

/** Bundled sources keyed by sha256, so unchanged files are never downloaded. */
function bundledBySha(bundled: Bundled) {
  const sources = new Map<string, number>();
  const hits = new Map<string, Partial<Record<Muscle, number[][]>>>();
  for (const a of releaseAssets(bundled.release)) {
    const id = bundled.assets[a.path];
    if (id !== undefined) sources.set(a.sha256, id);
    const h = bundled.hits[a.path];
    if (h) hits.set(a.sha256, h);
  }
  return { sources, hits };
}

export interface LoadedContent {
  release: ContentRelease;
  hits: HitRegions;
  resolve: (asset: MediaAsset) => MediaSource;
  /** Where it came from: the bundle, or a downloaded release. */
  origin: "bundled" | "remote";
}

/**
 * The release to run this session with. `uri(path)` turns a store path into a
 * file URI. Never throws: anything unreadable falls back to the bundle.
 */
export function loadContent(
  io: SyncIO,
  bundled: Bundled,
  uri: (path: string) => string,
): LoadedContent {
  const fromBundle = bundledBySha(bundled);
  const bundledContent: LoadedContent = {
    release: bundled.release,
    hits: bundled.hits,
    origin: "bundled",
    resolve: (a) => {
      const source = bundled.assets[a.path];
      if (source === undefined)
        throw new Error(`Missing bundled asset: ${a.path}`);
      return source;
    },
  };
  const state = readState(io);
  // No active release means the bundle, even when a previous one is kept.
  const candidates = state.active ? [state.active, state.previous] : [];
  for (const version of candidates) {
    const stored = readStored(io, bundled, version, fromBundle.sources);
    if (stored)
      return {
        ...stored,
        origin: "remote",
        resolve: (a) =>
          fromBundle.sources.get(a.sha256) ?? { uri: uri(filePath(a)) },
      };
  }
  return bundledContent;
}

/** A stored release whose files are all present, or null. */
function readStored(
  io: SyncIO,
  bundled: Bundled,
  version: string | null,
  bundledSources: Map<string, number>,
) {
  if (!version || compareVersions(version, bundled.release.contentVersion) <= 0)
    return null;
  try {
    const release = parseRelease(io.readText(releaseFile(version)));
    if (release.contentVersion !== version) return null;
    const hits = JSON.parse(io.readText(hitsFile(version))) as HitRegions;
    for (const a of releaseAssets(release)) {
      const present = a.path.endsWith(".svg")
        ? !!hits[a.path]
        : bundledSources.has(a.sha256) || io.exists(filePath(a));
      if (!present) return null;
    }
    return { release, hits };
  } catch {
    return null;
  }
}

async function verify(
  io: UpdateIO,
  path: string,
  expected: { bytes: number; sha256: string },
) {
  if (io.size(path) !== expected.bytes) fail(`${path}: size mismatch`);
  if ((await io.sha256(path)).toLowerCase() !== expected.sha256)
    fail(`${path}: checksum mismatch`);
}

/**
 * Checks the host and stages a newer release for the next start. Media that
 * the bundle or an earlier download already has (same sha256) is reused, so a
 * release that adds one exercise downloads only that exercise's files.
 */
export async function checkForUpdate(
  io: UpdateIO,
  bundled: Bundled,
  config: UpdateConfig,
): Promise<UpdateResult> {
  for (const dir of ["files", "releases", "tmp"]) io.mkdir(dir);
  const state = readState(io);
  if (
    !config.force &&
    state.lastCheck &&
    config.now - state.lastCheck < config.interval
  )
    return { status: "throttled" };
  writeState(io, { ...state, lastCheck: config.now });
  try {
    const pointer = parsePointer(
      await io.fetchText(config.baseUrl + "current.json"),
    );
    if (!compatible(pointer)) return { status: "incompatible" };
    const target = pointer.contentVersion;
    const fromBundle = bundledBySha(bundled);
    if (compareVersions(target, bundled.release.contentVersion) <= 0) {
      // The host rolled back to (or behind) what this build ships: use the bundle.
      if (state.active === null) return { status: "current" };
      writeState(io, { ...state, active: null, previous: null, lastCheck: config.now });
      collectGarbage(io);
      return { status: "staged", version: null, downloaded: 0 };
    }
    // Turned off by the user (it broke a screen): wait for a newer release.
    if (target === state.rejected) return { status: "current" };
    // Same version and intact on disk; a damaged copy is downloaded again.
    if (
      target === state.active &&
      readStored(io, bundled, target, fromBundle.sources)
    )
      return { status: "current" };

    clearTmp(io);
    await io.download(
      config.baseUrl + pointer.content.path,
      "tmp/content.json",
    );
    await verify(io, "tmp/content.json", pointer.content);
    const text = io.readText("tmp/content.json");
    const release = parseRelease(text);
    if (release.contentVersion !== target)
      fail("content.json version does not match current.json");

    const releaseBase =
      config.baseUrl +
      pointer.content.path.slice(0, pointer.content.path.lastIndexOf("/") + 1);
    const hits: HitRegions = {};
    let downloaded = 0;
    const seen = new Set<string>();
    const pending: MediaAsset[] = [];
    for (const a of releaseAssets(release)) {
      if (a.path.endsWith(".svg")) {
        const known = fromBundle.hits.get(a.sha256);
        if (known) {
          hits[a.path] = known;
          continue;
        }
      } else if (fromBundle.sources.has(a.sha256)) continue;
      if (seen.has(a.sha256) || io.exists(filePath(a))) continue;
      seen.add(a.sha256);
      pending.push(a);
    }
    // A few parallel downloads; any failure abandons the whole release.
    const queue = [...pending];
    let aborted = false;
    await Promise.all(
      Array.from({ length: Math.min(3, queue.length) }, async () => {
        for (let a = queue.shift(); a && !aborted; a = queue.shift()) {
          const tmp = `tmp/${a.sha256}`;
          try {
            await io.download(releaseBase + a.path, tmp);
            await verify(io, tmp, a);
          } catch (e) {
            aborted = true;
            throw e;
          }
          io.move(tmp, filePath(a));
          downloaded++;
        }
      }),
    );
    for (const a of releaseAssets(release))
      if (a.path.endsWith(".svg") && !hits[a.path])
        hits[a.path] = hitRegionsFromSvg(io.readText(filePath(a)));

    io.writeText(hitsFile(target), JSON.stringify(hits));
    io.writeText(releaseFile(target), JSON.stringify(release));
    // The switch: one atomic rename. Everything it points at is already verified.
    writeState(io, {
      active: target,
      previous: state.active,
      lastCheck: config.now,
      rejected: state.rejected,
    });
    clearTmp(io);
    collectGarbage(io);
    return { status: "staged", version: target, downloaded };
  } catch (e) {
    clearTmp(io);
    // Verified files stay in files/, so the retry only fetches what is still missing.
    const retry = Math.min(config.retry ?? config.interval, config.interval);
    writeState(io, { ...readState(io), lastCheck: config.now - config.interval + retry });
    return {
      status: "failed",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Stops using `version` (the downloaded release this session runs) and returns
 * to the bundle at the next start. That version is never downloaded again; a
 * newer one on the host is. For a release that loads but breaks a screen.
 */
export function rejectRelease(io: UpdateIO, version: string) {
  io.mkdir("tmp");
  const state = readState(io);
  writeState(io, { active: null, previous: null, lastCheck: state.lastCheck, rejected: version });
  collectGarbage(io);
}

function clearTmp(io: UpdateIO) {
  for (const name of io.list("tmp"))
    if (name !== "state.json") io.remove(`tmp/${name}`);
}

/** Keeps the active and previous releases (and their media); removes the rest. */
export function collectGarbage(io: UpdateIO) {
  const state = readState(io);
  const keep = new Set<string>();
  const files = new Set<string>();
  for (const v of [state.active, state.previous]) {
    if (!v) continue;
    keep.add(releaseFile(v).slice("releases/".length));
    keep.add(hitsFile(v).slice("releases/".length));
    try {
      for (const a of releaseAssets(parseRelease(io.readText(releaseFile(v)))))
        files.add(filePath(a).slice("files/".length));
    } catch {
      // A broken release keeps nothing.
    }
  }
  for (const name of io.list("releases"))
    if (!keep.has(name)) io.remove(`releases/${name}`);
  for (const name of io.list("files"))
    if (!files.has(name)) io.remove(`files/${name}`);
}
