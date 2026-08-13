import sys
from pathlib import Path

import pymupdf


WHITE_THRESHOLD = 245
RENDER_DPI = 120
BODY_TOP_FRACTION = 0.12
BODY_BOTTOM_FRACTION = 0.92
HORIZONTAL_MARGIN_FRACTION = 0.05
LINE_BAND_HEIGHT = 18
MIN_DARK_PIXELS = 40
MIN_DARK_SPAN = 40
DARK_PIXEL_TABLE = bytes(
    1 if value < WHITE_THRESHOLD else 0 for value in range(256)
)


def occupied_line_band_percent(pdf_path: Path) -> float:
    document = pymupdf.open(pdf_path)
    if len(document) != 1:
        raise ValueError(f"Expected one page, found {len(document)}.")

    pixmap = document[0].get_pixmap(
        dpi=RENDER_DPI,
        colorspace=pymupdf.csGRAY,
        alpha=False,
    )
    samples = memoryview(pixmap.samples)
    x_start = int(pixmap.width * HORIZONTAL_MARGIN_FRACTION)
    x_end = int(pixmap.width * (1 - HORIZONTAL_MARGIN_FRACTION))
    y_start = int(pixmap.height * BODY_TOP_FRACTION)
    y_end = int(pixmap.height * BODY_BOTTOM_FRACTION)
    occupied_bands = 0
    total_bands = 0

    for band_start in range(y_start, y_end, LINE_BAND_HEIGHT):
        band_end = min(band_start + LINE_BAND_HEIGHT, y_end)
        dark_pixels = 0
        first_dark_column = pixmap.width
        last_dark_column = -1

        for y in range(band_start, band_end):
            row = samples[y * pixmap.width : (y + 1) * pixmap.width]
            dark_mask = bytes(row[x_start:x_end]).translate(DARK_PIXEL_TABLE)
            dark_pixels += dark_mask.count(1)
            first = dark_mask.find(b"\x01")
            if first >= 0:
                first_dark_column = min(first_dark_column, x_start + first)
                last_dark_column = max(
                    last_dark_column,
                    x_start + dark_mask.rfind(b"\x01"),
                )

        total_bands += 1
        if (
            dark_pixels >= MIN_DARK_PIXELS
            and last_dark_column - first_dark_column + 1 >= MIN_DARK_SPAN
        ):
            occupied_bands += 1

    return occupied_bands / total_bands * 100


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(
            "Usage: check-resume-fill.py <resume.pdf> <minimum-occupied-percent>"
        )

    pdf_path = Path(sys.argv[1])
    minimum = float(sys.argv[2])
    measured = occupied_line_band_percent(pdf_path)

    print(
        f"Resume page fill: {measured:.1f}% occupied body line bands "
        f"(minimum {minimum:.1f}%)."
    )
    if measured < minimum:
        raise SystemExit(
            f"Resume occupies only {measured:.1f}% of its body line bands; "
            f"minimum is {minimum:.1f}%."
        )


if __name__ == "__main__":
    main()
