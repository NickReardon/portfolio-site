import sys
from pathlib import Path

import pymupdf


WHITE_THRESHOLD = 245
RENDER_DPI = 120


def bottom_blank_percent(pdf_path: Path) -> float:
    document = pymupdf.open(pdf_path)
    if len(document) != 1:
        raise ValueError(f"Expected one page, found {len(document)}.")

    pixmap = document[0].get_pixmap(dpi=RENDER_DPI, alpha=False)
    samples = memoryview(pixmap.samples)
    channels = pixmap.n
    last_ink_row = -1

    for y in range(pixmap.height):
        row_start = y * pixmap.width * channels
        row_end = row_start + pixmap.width * channels
        row = samples[row_start:row_end]
        if any(value < WHITE_THRESHOLD for value in row):
            last_ink_row = y

    if last_ink_row < 0:
        return 100.0

    return (pixmap.height - 1 - last_ink_row) / pixmap.height * 100


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(
            "Usage: check-resume-fill.py <resume.pdf> <max-bottom-blank-percent>"
        )

    pdf_path = Path(sys.argv[1])
    maximum = float(sys.argv[2])
    measured = bottom_blank_percent(pdf_path)

    print(
        f"Resume page fill: {measured:.1f}% bottom whitespace "
        f"(maximum {maximum:.1f}%)."
    )
    if measured > maximum:
        raise SystemExit(
            f"Resume leaves {measured:.1f}% of the page blank at the bottom; "
            f"maximum is {maximum:.1f}%."
        )


if __name__ == "__main__":
    main()
