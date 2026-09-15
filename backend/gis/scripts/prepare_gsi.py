from pathlib import Path
import csv
import re
import pymupdf


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

PDF_PATH = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "gsi"
    / "gsi_landslide_inventory.pdf"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "processed"
)

OUTPUT_PATH = OUTPUT_DIR / "gsi_landslide_inventory.csv"


# ============================================================
# CONSTANTS
# ============================================================

STATES = {
    "Arunachal Pradesh",
    "Assam",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Sikkim",
    "Tripura",
}

MATERIALS = {
    "Debris",
    "Rock",
    "Earth",
}

MOVEMENT_TYPES = {
    "Slide",
    "Flow",
    "Fall",
    "Topple",
    "Complex",
    "Spread",
    "Creep",
}


# ============================================================
# HELPERS
# ============================================================

def clean_text(value: str) -> str:
    """Normalize whitespace."""

    value = value.replace("\n", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def is_integer(value: str) -> bool:
    return bool(re.fullmatch(r"\d+", value.strip()))


def is_coordinate(value: str) -> bool:
    try:
        number = float(value)
        return -180 <= number <= 180
    except ValueError:
        return False


def is_latitude(value: str) -> bool:
    try:
        number = float(value)
        return -90 <= number <= 90
    except ValueError:
        return False


def is_history(value: str) -> bool:
    """
    History values in the GSI inventory may be:
    - NA
    - year
    - date
    - date + month/year
    """

    value = clean_text(value)

    if value.upper() == "NA":
        return True

    # Year
    if re.fullmatch(r"\d{4}", value):
        return True

    # Examples:
    # 17 May 2016
    # 02 April 2010
    # 02nd June 2020
    if re.search(
        r"\b\d{1,2}(st|nd|rd|th)?\s+"
        r"(January|February|March|April|May|June|July|August|"
        r"September|October|November|December)\s+\d{4}\b",
        value,
        re.IGNORECASE,
    ):
        return True

    return False


# ============================================================
# RECORD PARSER
# ============================================================

def parse_page(text: str):
    """
    Parse one GSI PDF page.

    PyMuPDF extracts table cells vertically:

        Sl.No.
        Slide_No
        State
        District
        ...

        1
        ASM/...
        Assam
        Hailakandi
        ...

    Therefore we identify record starts using integer Sl.No.
    and then locate the fixed structural fields.
    """

    lines = [
        clean_text(line)
        for line in text.splitlines()
    ]

    # Remove completely empty lines
    lines = [line for line in lines if line]

    # Remove table header
    header_index = -1

    for i, line in enumerate(lines):
        if line == "History":
            header_index = i
            break

    if header_index >= 0:
        lines = lines[header_index + 1:]

    records = []

    # --------------------------------------------------------
    # Find every possible record start.
    # --------------------------------------------------------

    record_starts = []

    for i, line in enumerate(lines):

        if not is_integer(line):
            continue

        # A valid record should be followed by a Slide_No.
        if i + 1 < len(lines):

            next_line = lines[i + 1]

            # GSI Slide_No generally contains / and letters.
            if "/" in next_line:
                record_starts.append(i)

    # --------------------------------------------------------
    # Parse each record.
    # --------------------------------------------------------

    for index, start in enumerate(record_starts):

        end = (
            record_starts[index + 1]
            if index + 1 < len(record_starts)
            else len(lines)
        )

        block = lines[start:end]

        if len(block) < 10:
            continue

        try:

            serial_no = block[0]
            slide_no = block[1]

            # ------------------------------------------------
            # State
            # ------------------------------------------------

            state_index = None

            for i in range(2, min(len(block), 8)):

                if block[i] in STATES:
                    state_index = i
                    break

            if state_index is None:
                continue

            state = block[state_index]

            # ------------------------------------------------
            # District
            # ------------------------------------------------

            if state_index + 1 >= len(block):
                continue

            district = block[state_index + 1]

            # ------------------------------------------------
            # Find latitude / longitude.
            #
            # Everything between district and latitude belongs
            # to Slide_Name + NH_SH_Location.
            # ------------------------------------------------

            coordinate_index = None

            for i in range(state_index + 2, len(block) - 4):

                if (
                    is_latitude(block[i])
                    and is_coordinate(block[i + 1])
                ):

                    # Avoid interpreting random numbers as coords.
                    lat = float(block[i])
                    lon = float(block[i + 1])

                    if (
                        5 <= lat <= 35
                        and 65 <= lon <= 100
                    ):
                        coordinate_index = i
                        break

            if coordinate_index is None:
                continue

            latitude = float(block[coordinate_index])
            longitude = float(block[coordinate_index + 1])

            # ------------------------------------------------
            # Material
            # ------------------------------------------------

            material_index = None

            for i in range(coordinate_index + 2, len(block)):

                if block[i] in MATERIALS:
                    material_index = i
                    break

            if material_index is None:
                continue

            material = block[material_index]

            # ------------------------------------------------
            # Movement Type
            # ------------------------------------------------

            movement_index = None

            for i in range(material_index + 1, len(block)):

                if block[i] in MOVEMENT_TYPES:
                    movement_index = i
                    break

            if movement_index is None:
                continue

            movement_type = block[movement_index]

            # ------------------------------------------------
            # History
            # ------------------------------------------------

            history = "NA"

            if movement_index + 1 < len(block):

                possible_history = clean_text(
                    " ".join(block[movement_index + 1:])
                )

                if possible_history:
                    history = possible_history

            # ------------------------------------------------
            # Slide Name + Location
            # ------------------------------------------------

            middle = block[
                state_index + 2:
                coordinate_index
            ]

            if not middle:
                continue

            # First field after District is normally Slide_Name.
            slide_name = middle[0]

            # Everything else belongs to NH/SH location.
            location_parts = middle[1:]

            nh_sh_location = " ".join(location_parts)

            # ------------------------------------------------
            # Create record
            # ------------------------------------------------

            record = {
                "Sl.No": int(serial_no),
                "Slide_No": slide_no,
                "State": state,
                "District": district,
                "Slide_Name": slide_name,
                "NH_SH_Location": nh_sh_location,
                "Latitude": latitude,
                "Longitude": longitude,
                "Material_Involved": material,
                "Movement_Type": movement_type,
                "History": history,
            }

            records.append(record)

        except Exception as error:

            print(
                f"Warning: failed to parse record block "
                f"starting at {serial_no}: {error}"
            )

    return records


# ============================================================
# MAIN EXTRACTION
# ============================================================

def main():

    print("=" * 70)
    print("Bhunetra - GSI Landslide Inventory Extraction")
    print("=" * 70)

    if not PDF_PATH.exists():

        print()
        print("ERROR: GSI PDF not found:")
        print(PDF_PATH)
        return

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print()
    print(f"Input PDF : {PDF_PATH}")
    print(f"Output CSV: {OUTPUT_PATH}")
    print()

    document = pymupdf.open(PDF_PATH)

    total_pages = len(document)

    print(f"Total pages: {total_pages}")
    print()

    all_records = []

    for page_number in range(total_pages):

        page = document[page_number]

        text = page.get_text("text")

        page_records = parse_page(text)

        all_records.extend(page_records)

        if (
            (page_number + 1) % 25 == 0
            or page_number == 0
            or page_number == total_pages - 1
        ):

            print(
                f"Processed pages: "
                f"{page_number + 1}/{total_pages} "
                f"| records collected: {len(all_records)}"
            )

    document.close()

    # --------------------------------------------------------
    # Remove duplicates
    # --------------------------------------------------------

    unique_records = {}

    for record in all_records:

        key = (
            record["Sl.No"],
            record["Slide_No"],
        )

        unique_records[key] = record

    records = list(unique_records.values())

    records.sort(
        key=lambda x: x["Sl.No"]
    )

    print()
    print("=" * 70)
    print("EXTRACTION COMPLETE")
    print("=" * 70)

    print(f"Raw records collected   : {len(all_records)}")
    print(f"Unique records           : {len(records)}")

    # --------------------------------------------------------
    # Save CSV
    # --------------------------------------------------------

    fieldnames = [
        "Sl.No",
        "Slide_No",
        "State",
        "District",
        "Slide_Name",
        "NH_SH_Location",
        "Latitude",
        "Longitude",
        "Material_Involved",
        "Movement_Type",
        "History",
    ]

    with open(
        OUTPUT_PATH,
        "w",
        newline="",
        encoding="utf-8",
    ) as csv_file:

        writer = csv.DictWriter(
            csv_file,
            fieldnames=fieldnames,
        )

        writer.writeheader()

        writer.writerows(records)

    print()
    print(f"CSV saved to:")
    print(OUTPUT_PATH)

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    if records:

        print()
        print("First 10 extracted records:")
        print("-" * 70)

        for record in records[:10]:

            print(
                f'{record["Sl.No"]}: '
                f'{record["State"]} | '
                f'{record["District"]} | '
                f'{record["Latitude"]}, '
                f'{record["Longitude"]}'
            )

        print()
        print("Last 5 extracted records:")
        print("-" * 70)

        for record in records[-5:]:

            print(
                f'{record["Sl.No"]}: '
                f'{record["State"]} | '
                f'{record["District"]} | '
                f'{record["Latitude"]}, '
                f'{record["Longitude"]}'
            )

        # ----------------------------------------------------
        # State statistics
        # ----------------------------------------------------

        print()
        print("Records by state:")
        print("-" * 70)

        state_counts = {}

        for record in records:

            state = record["State"]

            state_counts[state] = (
                state_counts.get(state, 0) + 1
            )

        for state, count in sorted(
            state_counts.items()
        ):

            print(
                f"{state:20} : {count}"
            )

    else:

        print()
        print("ERROR: No records were extracted.")
        print()
        print(
            "The PDF structure may require another parsing strategy."
        )


if __name__ == "__main__":
    main()