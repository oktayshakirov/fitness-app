"""Snapshot technically validated development media; never changes the approved bundle."""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) / 'dist'
release = json.loads((root/'src/content/bundled.json').read_text())
assets = {}
for exercise in release['exercises']:
    exercise['media'] = {}
    for model in ('male', 'female'):
        metadata = json.loads((source/exercise['id']/model/'asset.json').read_text())
        assert metadata['qa']['pass'] and metadata['model'] == model
        views = {}
        for view, paths in metadata['files'].items():
            pair = {}
            for kind, field in [('video','h264'), ('poster','poster')]:
                relative = paths[field]
                file = source/relative
                expected = metadata['media'][file.name]
                data = file.read_bytes()
                assert len(data) == expected['bytes'] and hashlib.sha256(data).hexdigest() == expected['sha256'], relative
                size = json.loads(subprocess.check_output(['ffprobe','-v','quiet','-select_streams','v:0','-show_entries','stream=width,height','-of','json',str(file)]))['streams'][0]
                target = root/'assets/development'/relative
                target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes(data)
                path = 'development/'+relative
                pair[kind] = dict(path=path,width=size['width'],height=size['height'],bytes=len(data),sha256=expected['sha256'])
                assets[path] = f"require('../../assets/{path}')"
            views[view] = pair
        exercise['media'][model] = views
release['contentVersion'] = 'development-2026-10-28'
(root/'src/content/preview.json').write_text(json.dumps(release,indent=2)+'\n')
(root/'src/content/preview.ts').write_text('// Development snapshot. Regenerate with scripts/import_preview.py.\nimport raw from "./preview.json";\nimport type { ContentRelease } from "./types";\nexport const release = raw as ContentRelease;\nexport const assets: Record<string, number> = {\n'+''.join(f'  {json.dumps(k)}: {v},\n' for k,v in sorted(assets.items()))+'};\n')
print(f'Snapshotted {len(assets)} checked development assets; approved bundle unchanged.')
