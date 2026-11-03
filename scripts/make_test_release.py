"""Build a local remote-content fixture for M6 device tests. Nothing is uploaded.

Usage: python3 scripts/make_test_release.py [RELEASES_DIR] [OUT_DIR]
Copies the current release (hard links, no extra disk) and publishes NEXT_VERSION on top of
it with one extra exercise: an existing one mirrored left-right, so its videos and posters
are new files with new checksums. Serve OUT_DIR over HTTP and point
EXPO_PUBLIC_CONTENT_URL at it. Needs ffmpeg (libx264) and cwebp.
"""
import copy, hashlib, json, os, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
releases = Path(sys.argv[1] if len(sys.argv) > 1 else '/Users/oktayshakirov/Coding/fitness-automation/releases')
out = Path(sys.argv[2] if len(sys.argv) > 2 else ROOT/'work'/'remote-fixture')
SOURCE, NEW_ID, NEXT_VERSION = 'push_up', 'push_up_mirrored', 'v0.3.1'
sha = lambda data: hashlib.sha256(data).hexdigest()

pointer = json.loads((releases/'current.json').read_text())
base = (releases/pointer['content']['path']).parent
release = json.loads((releases/pointer['content']['path']).read_bytes())
assert release['contentVersion'] < NEXT_VERSION, 'fixture must be newer than the bundled release'

shutil.rmtree(out, ignore_errors=True)
target = out/NEXT_VERSION
for path in base.rglob('*'):
    if path.is_file() and path.name != 'content.json':
        dest = target/path.relative_to(base)
        dest.parent.mkdir(parents=True, exist_ok=True)
        os.link(path, dest)

exercise = copy.deepcopy(next(e for e in release['exercises'] if e['id'] == SOURCE))
exercise['id'], exercise['name'] = NEW_ID, exercise['name'] + ' (mirrored test)'
with tempfile.TemporaryDirectory() as tmp:
    for model, views in exercise['media'].items():
        for view, media in views.items():
            for kind, asset in media.items():
                src = base/asset['path']
                name = Path(asset['path']).name.replace(SOURCE, NEW_ID)
                rel = f'{NEW_ID}/{model}/{name}'
                dest = target/rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                if kind == 'video':
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-vf', 'hflip', '-an',
                                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '28', '-movflags', '+faststart',
                                    str(dest)], check=True)
                else:
                    png = Path(tmp)/'poster.png'
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-vf', 'hflip', str(png)], check=True)
                    subprocess.run(['cwebp', '-quiet', '-q', '80', str(png), '-o', str(dest)], check=True)
                data = dest.read_bytes()
                media[kind] = {**asset, 'path': rel, 'bytes': len(data), 'sha256': sha(data)}
release['exercises'].append(exercise)
release['contentVersion'] = NEXT_VERSION

raw = json.dumps(release, indent=1).encode()
(target/'content.json').write_bytes(raw)
(out/'current.json').write_text(json.dumps({
    **pointer, 'contentVersion': NEXT_VERSION,
    'content': {'path': f'{NEXT_VERSION}/content.json', 'bytes': len(raw), 'sha256': sha(raw)},
}, indent=1))
print(f'{out}: {NEXT_VERSION} = {pointer["contentVersion"]} + {NEW_ID} '
      f'({sum(len(v) for v in exercise["media"].values()) * 2} new files)')
