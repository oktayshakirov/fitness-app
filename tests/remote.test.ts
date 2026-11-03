import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import raw from "../src/content/bundled.json";
import hits from "../src/content/hit-regions.json";
import { muscleAt } from "../src/content/hits";
import {
  checkForUpdate,
  compareVersions,
  hitRegionsFromSvg,
  loadContent,
  parseRelease,
  readState,
  type Bundled,
  type HitRegions,
  type UpdateIO,
} from "../src/content/remote";
import type {
  ContentRelease,
  Exercise,
  MediaAsset,
} from "../src/content/types";

const sha = (b: Buffer | string) =>
  createHash("sha256").update(b).digest("hex");
const svg = (id: string) =>
  `<svg viewBox="0 0 800 1000"><path id="${id}" d="M0 0 L100 0 L100 100 L0 100 Z"/></svg>`;

/** A tiny bundled release: one exercise, one body view. */
function makeBundled(): Bundled {
  const files: Record<string, string> = {
    "squat/male/front.mp4": "squat-video",
    "squat/male/front.webp": "squat-poster",
    "bodymap/male/front.webp": "body",
    "bodymap/male/chest.png": "chest-mask",
    "bodymap/male/hits_front.svg": svg("chest"),
  };
  const a = (path: string): MediaAsset => ({
    path,
    width: 10,
    height: 10,
    bytes: Buffer.byteLength(files[path]!),
    sha256: sha(files[path]!),
  });
  const release: ContentRelease = {
    schemaVersion: 1,
    minAppSchema: 1,
    contentVersion: "v0.3.0",
    exercises: [exercise("squat", a)],
    bodymap: {
      male: {
        front: {
          base: a("bodymap/male/front.webp"),
          masks: { chest: a("bodymap/male/chest.png") },
          hitRegions: a("bodymap/male/hits_front.svg"),
        },
      },
    },
    heroes: {},
    attribution: "test",
  };
  const assets: Record<string, number> = {};
  Object.keys(files).forEach(
    (p, i) => !p.endsWith(".svg") && (assets[p] = i + 1),
  );
  return {
    release,
    hits: {
      "bodymap/male/hits_front.svg": hitRegionsFromSvg(
        files["bodymap/male/hits_front.svg"]!,
      ),
    },
    assets,
  };
}

function exercise(id: string, a: (path: string) => MediaAsset): Exercise {
  return {
    id,
    name: id,
    primary: ["chest"],
    secondary: [],
    equipment: ["body_only"],
    steps: ["Move"],
    cues: [],
    mistakes: [],
    breathing: "",
    source: "",
    media: {
      male: {
        front: {
          video: a(`${id}/male/front.mp4`),
          poster: a(`${id}/male/front.webp`),
        },
      },
    },
  };
}

/** A host directory serving current.json + <version>/... and a phone directory. */
function setup() {
  const base = fs.mkdtempSync(join(tmpdir(), "content-"));
  const host = join(base, "host");
  const phone = join(base, "phone");
  fs.mkdirSync(phone, { recursive: true });
  const fetched: string[] = [];
  const url = "https://cdn.test/";
  const local = (u: string) => {
    assert.ok(u.startsWith(url), u);
    fetched.push(u.slice(url.length));
    const p = join(host, u.slice(url.length));
    if (!fs.existsSync(p)) throw new Error(`HTTP 404 ${u}`);
    return p;
  };
  const io: UpdateIO = {
    exists: (p) => fs.existsSync(join(phone, p)),
    readText: (p) => fs.readFileSync(join(phone, p), "utf8"),
    fetchText: async (u) => fs.readFileSync(local(u), "utf8"),
    download: async (u, dest) => fs.copyFileSync(local(u), join(phone, dest)),
    size: (p) => fs.statSync(join(phone, p)).size,
    sha256: async (p) => sha(fs.readFileSync(join(phone, p))),
    writeText: (p, t) => fs.writeFileSync(join(phone, p), t),
    move: (from, to) => fs.renameSync(join(phone, from), join(phone, to)),
    remove: (p) => fs.rmSync(join(phone, p), { force: true }),
    list: (d) =>
      fs.existsSync(join(phone, d)) ? fs.readdirSync(join(phone, d)) : [],
    mkdir: (d) => fs.mkdirSync(join(phone, d), { recursive: true }),
  };
  /** Publishes a release the way core/publish.py does: files, content.json, pointer last. */
  function publish(
    release: ContentRelease,
    files: Record<string, string | Buffer>,
    pointer: object = {},
  ) {
    const dir = join(host, release.contentVersion);
    fs.mkdirSync(dir, { recursive: true });
    for (const [p, data] of Object.entries(files)) {
      fs.mkdirSync(dirname(join(dir, p)), { recursive: true });
      fs.writeFileSync(join(dir, p), data);
    }
    const text = JSON.stringify({ ...release, futureField: { ignored: true } });
    fs.writeFileSync(join(dir, "content.json"), text);
    fs.writeFileSync(
      join(host, "current.json"),
      JSON.stringify({
        schemaVersion: 1,
        minAppSchema: 1,
        contentVersion: release.contentVersion,
        content: {
          path: `${release.contentVersion}/content.json`,
          bytes: Buffer.byteLength(text),
          sha256: sha(text),
        },
        ...pointer,
      }),
    );
  }
  return { io, publish, fetched, url, phone };
}

/** The bundle plus one new exercise whose files only the host has. */
function withNewExercise(bundled: Bundled, version = "v0.3.1", seed = "lunge") {
  const files: Record<string, string> = {
    [`${seed}/male/front.mp4`]: `${seed}-video`,
    [`${seed}/male/front.webp`]: `${seed}-poster`,
  };
  const a = (path: string): MediaAsset => ({
    path,
    width: 10,
    height: 10,
    bytes: Buffer.byteLength(files[path]!),
    sha256: sha(files[path]!),
  });
  const release = structuredClone(bundled.release);
  release.contentVersion = version;
  release.exercises.push(exercise(seed, a));
  // Unchanged files are published too; the app must not download them again.
  const all: Record<string, string> = {
    ...files,
    "squat/male/front.mp4": "squat-video",
  };
  return { release, files: all };
}

const config = (url: string, now = 1_000) => ({
  baseUrl: url,
  interval: 60_000,
  now,
});
const uri = (p: string) => `file:///phone/${p}`;

test("a release that adds an exercise downloads only its new files and activates on next start", async () => {
  const bundled = makeBundled();
  const { io, publish, fetched, url } = setup();
  const next = withNewExercise(bundled);
  publish(next.release, next.files);

  const before = loadContent(io, bundled, uri);
  assert.equal(before.origin, "bundled");
  const result = await checkForUpdate(io, bundled, config(url));
  assert.deepEqual(result, {
    status: "staged",
    version: "v0.3.1",
    downloaded: 2,
  });
  assert.deepEqual(fetched.sort(), [
    "current.json",
    "v0.3.1/content.json",
    "v0.3.1/lunge/male/front.mp4",
    "v0.3.1/lunge/male/front.webp",
  ]);

  const after = loadContent(io, bundled, uri);
  assert.equal(after.origin, "remote");
  assert.deepEqual(
    after.release.exercises.map((e) => e.id),
    ["squat", "lunge"],
  );
  const lunge = after.release.exercises[1]!.media.male!.front!;
  assert.match(
    (after.resolve(lunge.video) as { uri: string }).uri,
    /^file:\/\/\/phone\/files\/[0-9a-f]{64}\.mp4$/,
  );
  // Unchanged media still comes from the bundle, and bundled hit regions are reused.
  assert.equal(
    after.resolve(after.release.exercises[0]!.media.male!.front!.video),
    1,
  );
  assert.ok(after.hits["bodymap/male/hits_front.svg"]?.chest);
  assert.ok(!("futureField" in after.release));
  assert.deepEqual(io.list("tmp"), []);
});

test("checks are throttled, and the same version is not downloaded twice", async () => {
  const bundled = makeBundled();
  const { io, publish, fetched, url } = setup();
  const next = withNewExercise(bundled);
  publish(next.release, next.files);
  await checkForUpdate(io, bundled, config(url, 1_000));
  assert.deepEqual(await checkForUpdate(io, bundled, config(url, 2_000)), {
    status: "throttled",
  });
  fetched.length = 0;
  assert.deepEqual(await checkForUpdate(io, bundled, config(url, 100_000)), {
    status: "current",
  });
  assert.deepEqual(fetched, ["current.json"]);
});

test("a corrupted file rejects the whole release and keeps what was running", async () => {
  const bundled = makeBundled();
  const { io, publish, url } = setup();
  const next = withNewExercise(bundled);
  next.files["lunge/male/front.webp"] = "lunge-posteR"; // same size, wrong bytes
  publish(next.release, next.files);
  const result = await checkForUpdate(io, bundled, config(url));
  assert.equal(result.status, "failed");
  assert.match((result as { error: string }).error, /checksum mismatch/);
  assert.equal(readState(io).active, null);
  assert.equal(loadContent(io, bundled, uri).origin, "bundled");
  assert.deepEqual(io.list("tmp"), []);
});

test("content.json must match current.json, and a missing file fails cleanly", async () => {
  const bundled = makeBundled();
  const { io, publish, url } = setup();
  const next = withNewExercise(bundled);
  publish(next.release, next.files, {
    content: { path: "v0.3.1/content.json", bytes: 10, sha256: "0".repeat(64) },
  });
  assert.equal(
    (await checkForUpdate(io, bundled, config(url))).status,
    "failed",
  );

  const missing = withNewExercise(bundled, "v0.3.2");
  delete (missing.files as Record<string, string>)["lunge/male/front.mp4"];
  publish(missing.release, missing.files);
  const result = await checkForUpdate(io, bundled, config(url, 100_000));
  assert.match((result as { error: string }).error, /404/);
  assert.equal(loadContent(io, bundled, uri).origin, "bundled");
});

test("releases for a newer app schema are ignored without downloading", async () => {
  const bundled = makeBundled();
  const { io, publish, fetched, url } = setup();
  const next = withNewExercise(bundled);
  publish(next.release, next.files, { minAppSchema: 2 });
  assert.deepEqual(await checkForUpdate(io, bundled, config(url)), {
    status: "incompatible",
  });
  assert.deepEqual(fetched, ["current.json"]);
});

test("a second update keeps the previous release, prunes older media, and startup falls back", async () => {
  const bundled = makeBundled();
  const { io, publish, url } = setup();
  const first = withNewExercise(bundled, "v0.3.1", "lunge");
  publish(first.release, first.files);
  await checkForUpdate(io, bundled, config(url, 1_000));
  const second = withNewExercise(bundled, "v0.3.2", "dip");
  publish(second.release, second.files);
  assert.equal(
    (await checkForUpdate(io, bundled, config(url, 100_000))).status,
    "staged",
  );
  assert.deepEqual(readState(io), {
    active: "v0.3.2",
    previous: "v0.3.1",
    lastCheck: 100_000,
  });
  assert.equal(io.list("files").length, 4);

  // Lose one of v0.3.2's files: startup runs v0.3.1 instead.
  io.remove(
    io
      .list("files")
      .find((f) => f.startsWith(sha("dip-video")))!
      .replace(/^/, "files/"),
  );
  assert.equal(loadContent(io, bundled, uri).release.contentVersion, "v0.3.1");
  // The next check repairs it by fetching only the missing file.
  const repair = await checkForUpdate(io, bundled, config(url, 200_000));
  assert.deepEqual(repair, {
    status: "staged",
    version: "v0.3.2",
    downloaded: 1,
  });
  assert.equal(loadContent(io, bundled, uri).release.contentVersion, "v0.3.2");

  const third = withNewExercise(bundled, "v0.3.3", "row");
  publish(third.release, third.files);
  await checkForUpdate(io, bundled, config(url, 300_000));
  // v0.3.1's lunge files are gone; v0.3.2 (previous) and v0.3.3 remain.
  assert.ok(!io.list("files").some((f) => f.startsWith(sha("lunge-video"))));
  assert.deepEqual(io.list("releases").sort(), [
    "v0.3.2.hits.json",
    "v0.3.2.json",
    "v0.3.3.hits.json",
    "v0.3.3.json",
  ]);
});

test("the host rolling back to the bundled version returns the app to its bundle", async () => {
  const bundled = makeBundled();
  const { io, publish, url } = setup();
  const next = withNewExercise(bundled);
  publish(next.release, next.files);
  await checkForUpdate(io, bundled, config(url, 1_000));
  publish(bundled.release, {});
  assert.deepEqual(await checkForUpdate(io, bundled, config(url, 100_000)), {
    status: "staged",
    version: null,
    downloaded: 0,
  });
  assert.equal(loadContent(io, bundled, uri).origin, "bundled");
  assert.deepEqual(io.list("files"), []);
});

test("an app update with a newer bundle ignores older downloaded releases", async () => {
  const bundled = makeBundled();
  const { io, publish, url } = setup();
  const next = withNewExercise(bundled);
  publish(next.release, next.files);
  await checkForUpdate(io, bundled, config(url));
  const newer = structuredClone(bundled);
  newer.release.contentVersion = "v0.4.0";
  assert.equal(loadContent(io, newer, uri).release.contentVersion, "v0.4.0");
});

test("new hit-region SVGs are downloaded and converted to tap polygons", async () => {
  const bundled = makeBundled();
  const { io, publish, url } = setup();
  const next = withNewExercise(bundled);
  const shape = svg("abs");
  const view = next.release.bodymap.male!.front!;
  view.hitRegions = {
    ...view.hitRegions,
    bytes: shape.length,
    sha256: sha(shape),
  };
  next.files["bodymap/male/hits_front.svg"] = shape;
  publish(next.release, next.files);
  await checkForUpdate(io, bundled, config(url));
  const loaded = loadContent(io, bundled, uri);
  assert.equal(
    muscleAt(
      loaded.release.bodymap.male!.front!,
      50,
      50,
      loaded.hits as HitRegions,
    ),
    "abs",
  );
});

test("the real bundled release parses unchanged, and its SVG conversion matches the importer", () => {
  const release = raw as ContentRelease;
  assert.deepEqual(parseRelease(JSON.stringify(release)), release);
  const path = "bodymap/male/hits_front.svg";
  const file = fs.readFileSync(
    new URL("../assets/content/" + path, import.meta.url),
    "utf8",
  );
  assert.deepEqual(hitRegionsFromSvg(file), (hits as HitRegions)[path]);
});

test("unsafe or malformed releases are rejected", () => {
  const release = structuredClone(raw) as ContentRelease;
  release.exercises[0]!.media.male!.front!.video.path = "../../escape.mp4";
  assert.throws(
    () => parseRelease(JSON.stringify(release)),
    /not a valid media asset/,
  );
  assert.throws(
    () => parseRelease(JSON.stringify({ ...(raw as object), minAppSchema: 2 })),
    /newer app/,
  );
  assert.throws(
    () => parseRelease(JSON.stringify({ ...(raw as object), exercises: [] })),
    /no exercises/,
  );
  const unknown = structuredClone(raw) as ContentRelease;
  (unknown.exercises[0]!.secondary as string[]).push("tail");
  assert.ok(
    !parseRelease(JSON.stringify(unknown)).exercises[0]!.secondary.includes(
      "tail" as never,
    ),
  );
  assert.equal(compareVersions("v0.10.0", "v0.9.2"), 1);
  assert.equal(compareVersions("v0.3.0", "v0.3.0"), 0);
});
