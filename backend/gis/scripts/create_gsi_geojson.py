from pathlib import Path
import csv
import json


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_CSV = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "gsi_landslide_inventory.csv"
)

OUTPUT_GEOJSON = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "gsi_landslide_inventory.geojson"
)


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("Bhunetra - GSI Inventory → GeoJSON")
    print("=" * 70)

    if not INPUT_CSV.exists():
        print()
        print("ERROR: Input CSV not found:")
        print(INPUT_CSV)
        return

    print()
    print(f"Input : {INPUT_CSV}")
    print(f"Output: {OUTPUT_GEOJSON}")

    features = []

    with open(
        INPUT_CSV,
        "r",
        encoding="utf-8",
        newline="",
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            try:
                latitude = float(row["Latitude"])
                longitude = float(row["Longitude"])

            except (ValueError, TypeError):
                print(
                    f"Skipping invalid coordinates "
                    f"for record {row.get('Sl.No')}"
                )
                continue

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        longitude,
                        latitude,
                    ],
                },
                "properties": {
                    "id": int(row["Sl.No"]),
                    "slide_no": row["Slide_No"],
                    "state": row["State"],
                    "district": row["District"],
                    "slide_name": row["Slide_Name"],
                    "nh_sh_location": row["NH_SH_Location"],
                    "latitude": latitude,
                    "longitude": longitude,
                    "material": row["Material_Involved"],
                    "movement_type": row["Movement_Type"],
                    "history": row["History"],
                    "source": "GSI Field Validated Landslide Inventory",
                },
            }

            features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "name": "GSI Field Validated Landslide Inventory",
        "source": "Geological Survey of India",
        "description": (
            "Field validated landslide inventory used by "
            "Bhunetra for historical landslide visualization "
            "and geospatial analysis."
        ),
        "features": features,
    }

    with open(
        OUTPUT_GEOJSON,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            geojson,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print()
    print("=" * 70)
    print("CONVERSION COMPLETE")
    print("=" * 70)

    print(f"Features created: {len(features)}")
    print()
    print("GeoJSON saved to:")
    print(OUTPUT_GEOJSON)


if __name__ == "__main__":
    main()