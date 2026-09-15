from pathlib import Path
import gzip
import shutil
import urllib.request

BASE_DIR = Path(__file__).resolve().parents[2]
DEM_DIR = BASE_DIR / "data" / "raw" / "dem"

BASE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/skadi"
EXPECTED_SIZE = 3601 * 3601 * 2

MISSING_TILES = [
    "N28E093",
    "N28E088",
    "N29E094",
    "N29E095",
    "N27E097",
    "N29E096",
    "N28E097",
    "N26E089",
    "N22E091",
    "N28E092",
    "N21E092",
]


def download_tile(tile: str):
    DEM_DIR.mkdir(parents=True, exist_ok=True)

    hgt_path = DEM_DIR / f"{tile}.hgt"
    compressed_path = DEM_DIR / f"{tile}.hgt.gz"

    if hgt_path.exists():
        print(f"[SKIP] {tile}.hgt already exists")
        return

    url = f"{BASE_URL}/{tile[:3]}/{tile}.hgt.gz"

    print(f"[DOWNLOAD] {tile}")
    print(f"URL: {url}")

    urllib.request.urlretrieve(
        url,
        compressed_path,
    )

    print(f"[EXTRACT] {tile}")

    with gzip.open(compressed_path, "rb") as source:
        with hgt_path.open("wb") as destination:
            shutil.copyfileobj(source, destination)

    compressed_path.unlink()

    actual_size = hgt_path.stat().st_size

    if actual_size != EXPECTED_SIZE:
        raise ValueError(
            f"Unexpected DEM size for {tile}: "
            f"{actual_size} bytes"
        )

    print(f"[OK] {tile} ({actual_size:,} bytes)")


def main():
    print("=" * 70)
    print("BhuNetra - Supplementary SRTM DEM Downloader")
    print("=" * 70)
    print(f"Additional DEM tiles: {len(MISSING_TILES)}")
    print()

    failed = []

    for tile in MISSING_TILES:
        try:
            download_tile(tile)
        except Exception as exc:
            print(f"[FAILED] {tile}: {exc}")
            failed.append(tile)

    print()
    print("=" * 70)
    print("DOWNLOAD SUMMARY")
    print("=" * 70)
    print(f"Requested : {len(MISSING_TILES)}")
    print(f"Failed    : {len(failed)}")
    print(f"Successful: {len(MISSING_TILES) - len(failed)}")

    if failed:
        print()
        print("Failed tiles:")
        for tile in failed:
            print(f"  - {tile}")

        raise RuntimeError(
            "Some supplementary DEM tiles failed to download."
        )

    print()
    print("All supplementary DEM tiles downloaded successfully.")


if __name__ == "__main__":
    main()
