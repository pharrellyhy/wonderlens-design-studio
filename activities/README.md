# Activities

Per-game directory layout. Each subdirectory describes one activity in 5 files.

## Layout

```
activities/
├── _schema/
│   └── tag_block.schema.json        # JSON Schema for tag_block.yaml
├── README.md                         # this file
└── <activity_id>/
    ├── spec.md                       # authoring intent: premise, target, rationale, selection trigger
    ├── prod.md                       # runtime dialogue + step instructions
    ├── tag_block.yaml                # structured metadata (validated against _schema/tag_block.schema.json)
    ├── recap.template.yaml           # child recap payload shape (runtime-rendered)
    └── dashboard.template.yaml       # parent dashboard fragment shape (runtime-rendered)
```

The directory name MUST equal the `activity_id` inside that dir's `tag_block.yaml`.

## File roles

| File | Audience | Format | Runtime role |
|---|---|---|---|
| `spec.md` | authors, reviewers | Markdown prose | design reference; not loaded by runtime |
| `prod.md` | authors, LLM prompt composer | Markdown prose | quoted into prompts; beat-level guidance |
| `tag_block.yaml` | matcher, selector | YAML | machine-readable metadata; schema-validated |
| `recap.template.yaml` | recap renderer | YAML with `{placeholders}` | per-session payload emitted at activity end |
| `dashboard.template.yaml` | parent dashboard roller | YAML with `{placeholders}` | per-session fragment merged into device rollup |

## Canonical vocabulary

The three closed enums in `tag_block.yaml activity_signature` — `observation_angle` (12), `mechanic` (10), `entity_role` (4) — are defined in [`docs/activity_vocabulary.md`](../docs/activity_vocabulary.md). The schema's enum lists must stay in sync with that doc; drift is CI-blocked.

For field ownership and authoring guidance, use [`docs/activity_tag_block_usage.md`](../docs/activity_tag_block_usage.md). It separates matcher-facing, runtime-presentation, child-recap, and parent-dashboard fields.

For a full tag-block plus progression-algorithm reference, use [`docs/activity_tag_block_progression_guide.md`](../docs/activity_tag_block_progression_guide.md) or the Chinese companion [`docs/activity_tag_block_progression_guide_cn.md`](../docs/activity_tag_block_progression_guide_cn.md). For workflow diagrams, use [`docs/activity_matcher_progression_workflows.md`](../docs/activity_matcher_progression_workflows.md) or the Chinese companion [`docs/activity_matcher_progression_workflows_cn.md`](../docs/activity_matcher_progression_workflows_cn.md).

## Validation

Validate all `tag_block.yaml` files against the schema:

```bash
python3 -c "
import json, yaml, pathlib, sys
from jsonschema import Draft202012Validator
schema = json.loads(pathlib.Path('activities/_schema/tag_block.schema.json').read_text())
v = Draft202012Validator(schema)
ok = True
for p in sorted(pathlib.Path('activities').glob('*/tag_block.yaml')):
    errs = list(v.iter_errors(yaml.safe_load(p.read_text())))
    print(('OK  ' if not errs else 'FAIL'), p)
    for e in errs:
        ok = False
        print(f'  {list(e.absolute_path)}: {e.message}')
sys.exit(0 if ok else 1)
"
```

Requires `pip install jsonschema pyyaml`.

## Current V1 coverage

5 games migrated to this layout; 19 games remain on the legacy single-`.md` layout under `designs/`. The backend loader supports both during migration. Follow-up PRs migrate the rest.

## Cross-repo notes

Consumer repos (`wonderlens-ai`, `wonderlens-activity-fullstack-demo`) mirror this schema's enums in code. Additions to `docs/activity_vocabulary.md` require matching changes in both consumer repos; see the `## Versioning` section of that doc.
