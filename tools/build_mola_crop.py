import json
import struct
from pathlib import Path
from urllib.request import Request, urlopen


SOURCE_URL = (
    "https://pds-geosciences.wustl.edu/mgs/"
    "mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg032/megr90n000fb.img"
)
PRODUCT_ID = "MEGR90N000FB.IMG"
DATA_SET_ID = "MGS-M-MOLA-5-MEGDR-L3-V1.0"
PDS_REFERENCE_RADIUS_M = 3_396_000
PIXELS_PER_DEGREE = 32
SOURCE_COLUMNS = 11_520
SOURCE_ROW_BYTES = SOURCE_COLUMNS * 2
FIRST_ROW = 512
ROW_COUNT = 65
FIRST_COLUMN = 5_151
COLUMN_COUNT = 257
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "mola-korolev-32ppd.json"


def main():
    first_byte = FIRST_ROW * SOURCE_ROW_BYTES
    last_byte = (FIRST_ROW + ROW_COUNT) * SOURCE_ROW_BYTES - 1
    request = Request(SOURCE_URL, headers={"Range": f"bytes={first_byte}-{last_byte}"})

    with urlopen(request, timeout=60) as response:
        expected_range = f"bytes {first_byte}-{last_byte}/"
        content_range = response.headers.get("Content-Range", "")
        if response.status != 206 or not content_range.startswith(expected_range):
            raise RuntimeError(f"Unexpected MOLA range response: {response.status}, {content_range}")
        source_bytes = response.read()

    expected_size = ROW_COUNT * SOURCE_ROW_BYTES
    if len(source_bytes) != expected_size:
        raise RuntimeError(f"Expected {expected_size} bytes, received {len(source_bytes)}")

    values = []
    for row_index in range(ROW_COUNT):
        row_offset = row_index * SOURCE_ROW_BYTES + FIRST_COLUMN * 2
        row_values = struct.unpack_from(f">{COLUMN_COUNT}h", source_bytes, row_offset)
        values.append(list(row_values))

    document = {
        "source_url": SOURCE_URL,
        "data_set_id": DATA_SET_ID,
        "product_id": PRODUCT_ID,
        "doi": "10.17189/1519460",
        "pixels_per_degree": PIXELS_PER_DEGREE,
        "first_row": FIRST_ROW,
        "first_column": FIRST_COLUMN,
        "rows": ROW_COUNT,
        "columns": COLUMN_COUNT,
        "reference_radius_m": PDS_REFERENCE_RADIUS_M,
        "values_m_above_reference_radius": values,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(document, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {ROW_COUNT} x {COLUMN_COUNT} MOLA crop to {OUTPUT}")


if __name__ == "__main__":
    main()
