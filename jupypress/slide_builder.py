"""
SlideData model and builder to convert notebook metadata + cells into slide structure.
"""

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class CellSlot:
    """
    A single cell assigned to a slide slot.
    """

    cell_index: int
    cell_type: str  # 'markdown', 'code'
    include: str = "full"  # 'full', 'input-only', 'output-only'
    order: int = 0


@dataclass
class SlideData:
    """
    Represents a single slide with its layout and cell assignments.
    """

    id: str
    name: str
    layout: str  # 'title', 'default', 'two-col-h', 'two-col-v', 'three-row-v', 'three-row-h'
    show_header: bool = True
    slots: Dict[str, List[CellSlot]] = field(default_factory=dict)

    def __post_init__(self):
        """Validate layout."""
        valid_layouts = {
            "title",
            "default",
            "two-col-h",
            "two-col-v",
            "three-row-v",
            "three-row-h",
        }
        if self.layout not in valid_layouts:
            raise ValueError(
                f"Invalid layout: {self.layout}. Must be one of {valid_layouts}"
            )


class SlideBuilder:
    """
    Builds a list of SlideData objects from notebook metadata and cells.
    """

    def __init__(self, notebook):
        """
        Initialize the slide builder.

        Args:
            notebook: nbformat notebook object
        """
        self.notebook = notebook
        self.metadata = notebook.get("metadata", {}).get("jupypress", {})

    def build(self) -> List[SlideData]:
        """
        Build and return list of SlideData objects.

        Returns:
            List[SlideData]: Ordered list of slides with cell assignments
        """
        slides_meta = self.metadata.get("slides", [])
        slides = []

        for slide_meta in slides_meta:
            slide = SlideData(
                id=slide_meta.get("id", ""),
                name=slide_meta.get("name", "Untitled"),
                layout=slide_meta.get("layout", "default"),
                show_header=slide_meta.get("showHeader", True),
            )

            # Match cells assigned to this slide
            for cell_idx, cell in enumerate(self.notebook.get("cells", [])):
                cell_meta = cell.get("metadata", {}).get("jupypress", {})
                if cell_meta.get("slideId") == slide.id:
                    slot_name = cell_meta.get("slot", "content")
                    cell_slot = CellSlot(
                        cell_index=cell_idx,
                        cell_type=cell.get("cell_type", "markdown"),
                        include=cell_meta.get("include", "full"),
                        order=cell_meta.get("order", 0),
                    )

                    if slot_name not in slide.slots:
                        slide.slots[slot_name] = []
                    slide.slots[slot_name].append(cell_slot)

            # Sort cells within each slot by order
            for slot_cells in slide.slots.values():
                slot_cells.sort(key=lambda x: x.order)

            slides.append(slide)

        return slides
