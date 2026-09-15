from pathlib import Path
import gzip
import shutil
import urllib.request

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]

GSI_PATH = BASE_DIR / "data" / "processed" / "gsi_landslide_inventory.csv"
DEM_DIR = BASE_DIR / "data" / "raw" / "dem"

BASE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/skadi"

EXPECTED_CELLS = 3601


def tile_name(latitude: float, longitude: float) -> str:
    lat_prefix = "N" if latitude >= 0 else "S"
    lon_prefix = "E" if longitude >= 0 else "W"

    return (
        f"{lat_prefix}{abs(int(latitude)):02d}"
        f"{lon_prefix}{abs(int(longitude)):03d}"
    )


def download_tile(tile: str):
    hemisphere_lat = tile[:3]
    hemisphere_lon = tile[3:]

    url = (
        f"{BASE_URL}/"
        f"{hemisphere_lat}/"
        f"{tile}.hgt.gz"
    )

    compressed_path = DEM_DIR / f"{tile}.hgt.gz"
    hgt_path = DEM_DIR / f"{tile}.hgt"

    if hgt_path.exists():
        print(f"[SKIP] {tile}.hgt already exists")
        return

    print(f"[DOWNLOAD] {tile}")

    urllib.request.urlretrieve(
        url,
        compressed_path,
    )

    print(f"[EXTRACT] {tile}")

    with gzip.open(compressed_path, "rb") as source:
        with hgt_path.open("wb") as destination:
            shutil.copyfileobj(source, destination)

    compressed_path.unlink()

    expected_size = EXPECTED_CELLS * EXPECTED_CELLS * 2

    actual_size = hgt_path.stat().st_size

    if actual_size != expected_size:
        raise ValueError(
            f"Unexpected DEM size for {tile}: "
            f"{actual_size} bytes"
        )

    print(f"[OK] {tile}")


def main():
    DEM_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    if not GSI_PATH.exists():
        raise FileNotFoundError(
            f"GSI inventory not found: {GSI_PATH}"
        )

    data = pd.read_csv(GSI_PATH)

    tiles = sorted(
        {
            tile_name(latitude, longitude)
            for latitude, longitude
            in zip(data["Latitude"], data["Longitude"])
        }
    )

    print("=" * 70)
    print("BhuNetra - SRTM DEM Downloader")
    print("=" * 70)
    print(f"GSI points : {len(data)}")
    print(f"DEM tiles  : {len(tiles)}")
    print()

    failed = []

    for tile in tiles:
        try:
            download_tile(tile)
        except Exception as exc:
            print(f"[FAILED] {tile}: {exc}")
            failed.append(tile)

    print()
    print("=" * 70)
    print("DOWNLOAD SUMMARY")
    print("=" * 70)
    print(f"Requested : {len(tiles)}")
    print(f"Failed    : {len(failed)}")

    if failed:
        print("Failed tiles:")
        for tile in failed:
            print(f"  - {tile}")
        raise RuntimeError("Some DEM tiles failed to download.")

    print()
    print("All required SRTM DEM tiles downloaded successfully.")


if __name__ == "__main__":
    main()
