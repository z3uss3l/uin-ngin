import json
from uin.pipeline.steps import step_import, step_normalize, step_export
from uin.pipeline.context import PipelineContext

doc = {
    "meta": {},
    "shapes": [
        {
            "id": "x",
            "type": "rect",
            "x": 0,
            "y": 0,
            "width": 1,
            "height": 1,
            "color": {"r": 0, "g": 0, "b": 0, "a": 1.0},
        }
    ],
}
raw = json.dumps(doc)
ctx = step_import(PipelineContext(), raw)
print('after import, doc type', type(ctx.doc))
ctx = step_normalize(ctx)
print('after normalize, doc type', type(ctx.doc))
out = step_export(ctx)
print('out repr:', repr(out))
print('out type:', type(out))
print(out)
