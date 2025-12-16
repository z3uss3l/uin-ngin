# path: uin/dashboard/ui.py
from uin.core.schema import UINDocument
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def render_document(doc: UINDocument, figsize=(6,6)):
    fig, ax = plt.subplots(figsize=figsize)
    for shape in doc.shapes:
        color = shape.color
        c = (color.r/255, color.g/255, color.b/255, color.a)
        if shape.type == "rect":
            rect = patches.Rectangle((shape.x, shape.y), shape.width, shape.height, color=c)
            ax.add_patch(rect)
        elif shape.type == "circle":
            circ = patches.Circle((shape.x, shape.y), shape.radius, color=c)
            ax.add_patch(circ)
    ax.set_xlim(0,10)
    ax.set_ylim(0,10)
    ax.set_aspect('equal')
    plt.show()
