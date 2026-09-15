import { useMemo } from "react";
import {
  MapPin,
  Navigation,
  Radio,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useLocation } from "../../context/LocationContext.jsx";

const NER_LOCATIONS = [
  {
    state: "Assam",
    places: [
      { name: "Dima Hasao", latitude: 25.6532, longitude: 93.1028 },
      { name: "Guwahati", latitude: 26.1445, longitude: 91.7362 },
    ],
  },
  {
    state: "Arunachal Pradesh",
    places: [
      { name: "West Kameng", latitude: 27.2489, longitude: 92.5541 },
      { name: "Tawang", latitude: 27.586, longitude: 91.859 },
    ],
  },
  {
    state: "Manipur",
    places: [
      { name: "Senapati", latitude: 25.2678, longitude: 94.0165 },
      { name: "Imphal", latitude: 24.817, longitude: 93.9368 },
    ],
  },
  {
    state: "Meghalaya",
    places: [
      { name: "Garo Hills", latitude: 25.5707, longitude: 90.2167 },
      { name: "Shillong", latitude: 25.5788, longitude: 91.8933 },
    ],
  },
  {
    state: "Mizoram",
    places: [
      { name: "Lunglei", latitude: 22.8892, longitude: 92.7347 },
      { name: "Aizawl", latitude: 23.7271, longitude: 92.7176 },
    ],
  },
  {
    state: "Nagaland",
    places: [
      { name: "Kohima", latitude: 25.6751, longitude: 94.1086 },
      { name: "Dimapur", latitude: 25.8629, longitude: 93.7533 },
    ],
  },
  {
    state: "Sikkim",
    places: [
      { name: "North Sikkim", latitude: 27.8528, longitude: 88.4252 },
      { name: "Gangtok", latitude: 27.3389, longitude: 88.6065 },
    ],
  },
  {
    state: "Tripura",
    places: [
      { name: "Agartala", latitude: 23.8315, longitude: 91.2868 },
    ],
  },
];

export function LocationSelector() {
  const {
    location,
    locationMode,
    locationStatus,
    locationContext,
    locationError,
    selectLocation,
    useCurrentLocation,
  } = useLocation();

  const selectedState = location?.state || "";

  const selectedStateData = useMemo(
    () => NER_LOCATIONS.find((item) => item.state === selectedState),
    [selectedState]
  );

  const selectedPlace = useMemo(() => {
    if (!selectedStateData) return null;

    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return (
      selectedStateData.places.find(
        (place) =>
          Math.abs(place.latitude - latitude) < 0.0001 &&
          Math.abs(place.longitude - longitude) < 0.0001
      ) || null
    );
  }, [selectedStateData, location?.latitude, location?.longitude]);

  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  const hasCoordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude);

  const insideNER =
    locationContext?.inside_ner ??
    location?.insideNER ??
    false;

  const nearestZone =
    locationContext?.nearest_zone ??
    null;

  const handleStateChange = (event) => {
    const state = event.target.value;

    const stateData = NER_LOCATIONS.find(
      (item) => item.state === state
    );

    if (!stateData?.places?.length) return;

    const place = stateData.places[0];

    // IMPORTANT:
    // The selected NER place coordinates become the new source
    // immediately. The backend then resolves its NER context.
    selectLocation(place.latitude, place.longitude);
  };

  const handlePlaceChange = (event) => {
    const placeName = event.target.value;

    const place = selectedStateData?.places.find(
      (item) => item.name === placeName
    );

    if (!place) return;

    // IMPORTANT:
    // Never retain the browser/GPS coordinates when the user
    // manually chooses an NER place.
    selectLocation(place.latitude, place.longitude);
  };

  const modeLabel =
    locationMode === "live"
      ? "LIVE LOCATION"
      : "SELECTED LOCATION";

  return (
    <section className="w-full rounded-xl border border-base-border bg-[#080d14] px-3 py-3 shadow-sm">

      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-2.5">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyber/20 bg-cyber/5">
            <MapPin size={16} className="text-cyber" />
          </div>

          <div>
            <div className="flex items-center gap-2">

              <h2 className="font-sans text-sm font-semibold text-text-primary">
                Location Intelligence
              </h2>

              <span className="rounded border border-base-border px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-text-muted">
                {modeLabel}
              </span>

            </div>

            <p className="font-mono text-[9px] tracking-wider text-text-muted">
              LOCATION-AWARE NER MONITORING CONTEXT
            </p>
          </div>

        </div>

        <div className="flex items-center gap-2">

          <span
            className={`h-1.5 w-1.5 rounded-full ${
              locationStatus === "loading"
                ? "animate-pulse bg-amber-400"
                : locationError
                  ? "bg-red-400"
                  : "bg-emerald-400"
            }`}
          />

          <span className="font-mono text-[10px] text-text-secondary">
            {locationStatus === "loading"
              ? "LOCATING..."
              : locationError
                ? "LOCATION ERROR"
                : "LOCATION CONNECTED"}
          </span>

        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[auto_1fr_1fr]">

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locationStatus === "loading"}
          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-cyber/25 bg-cyber/5 px-4 font-mono text-[10px] font-semibold tracking-wider text-cyber transition hover:bg-cyber/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locationStatus === "loading" ? (
            <Radio size={14} className="animate-pulse" />
          ) : (
            <Navigation size={14} />
          )}

          {locationStatus === "loading"
            ? "LOCATING..."
            : "USE CURRENT LOCATION"}
        </button>

        {/* State */}
        <label className="relative">

          <span className="absolute left-3 top-1.5 z-10 font-mono text-[8px] tracking-wider text-text-muted">
            NER STATE
          </span>

          <select
            value={selectedState}
            onChange={handleStateChange}
            className="h-10 w-full appearance-none rounded-lg border border-base-border bg-base-card px-3 pb-1 pt-4 font-sans text-xs text-text-primary outline-none transition focus:border-cyber/50"
          >
            <option value="">Select NER state</option>

            {NER_LOCATIONS.map((item) => (
              <option key={item.state} value={item.state}>
                {item.state}
              </option>
            ))}
          </select>

          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-5 text-text-muted"
          />

        </label>

        {/* Place */}
        <label className="relative">

          <span className="absolute left-3 top-1.5 z-10 font-mono text-[8px] tracking-wider text-text-muted">
            MONITORING LOCATION
          </span>

          <select
            value={selectedPlace?.name || ""}
            onChange={handlePlaceChange}
            disabled={!selectedStateData}
            className="h-10 w-full appearance-none rounded-lg border border-base-border bg-base-card px-3 pb-1 pt-4 font-sans text-xs text-text-primary outline-none transition focus:border-cyber/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <option value="">Select location</option>

            {selectedStateData?.places.map((place) => (
              <option key={place.name} value={place.name}>
                {place.name}
              </option>
            ))}
          </select>

          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-5 text-text-muted"
          />

        </label>
      </div>

      {/* Location information */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4">

        <div className="rounded-lg border border-base-border bg-base-card/60 px-3 py-2">
          <div className="font-mono text-[8px] tracking-wider text-text-muted">
            COORDINATES
          </div>

          <div className="mt-1 truncate font-mono text-[10px] text-text-primary">
            {hasCoordinates
              ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
              : "Waiting for location"}
          </div>
        </div>

        <div className="rounded-lg border border-base-border bg-base-card/60 px-3 py-2">

          <div className="font-mono text-[8px] tracking-wider text-text-muted">
            REGION
          </div>

          <div
            className={`mt-1 flex items-center gap-1.5 font-mono text-[10px] ${
              insideNER
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            {insideNER ? (
              <ShieldCheck size={11} />
            ) : (
              <AlertTriangle size={11} />
            )}

            {insideNER
              ? location?.state || "NER"
              : "OUTSIDE NER"}
          </div>
        </div>

        <div className="rounded-lg border border-base-border bg-base-card/60 px-3 py-2">

          <div className="font-mono text-[8px] tracking-wider text-text-muted">
            CONTEXT
          </div>

          <div className="mt-1 truncate font-sans text-[10px] text-text-primary">
            {selectedPlace?.name || "Current position"}
          </div>

        </div>

        <div className="rounded-lg border border-base-border bg-base-card/60 px-3 py-2">

          <div className="font-mono text-[8px] tracking-wider text-text-muted">
            NEAREST ZONE
          </div>

          <div className="mt-1 truncate font-sans text-[10px] text-text-primary">
            {nearestZone?.name || "No monitored zone"}
          </div>

        </div>
      </div>

      {/* Inside NER */}
      {insideNER && nearestZone && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.03] px-3 py-2">

          <div className="flex items-center gap-2">

            <ShieldCheck
              size={13}
              className="text-emerald-400"
            />

            <span className="font-mono text-[9px] tracking-wider text-text-secondary">
              NER CONTEXT ACTIVE
            </span>

            <span className="text-text-muted">
              ·
            </span>

            <span className="font-sans text-[10px] text-text-primary">
              {nearestZone.name}
            </span>

          </div>

          {Number.isFinite(
            Number(nearestZone.distance_km)
          ) && (
            <span className="font-mono text-[9px] text-text-muted">
              {Number(nearestZone.distance_km).toFixed(1)} km from monitored zone
            </span>
          )}

        </div>
      )}

      {/* Outside NER */}
      {!insideNER && hasCoordinates && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-400/15 bg-amber-400/[0.03] px-3 py-2">

          <AlertTriangle
            size={13}
            className="text-amber-400"
          />

          <span className="font-mono text-[9px] tracking-wider text-amber-300">
            OUTSIDE BHUNETRA NER REGION
          </span>

          <span className="hidden text-[9px] text-text-muted sm:inline">
            · Existing NER monitoring data remains unchanged
          </span>

        </div>
      )}

      {/* Error */}
      {locationError && (
        <div className="mt-2 rounded-lg border border-red-400/15 bg-red-400/[0.03] px-3 py-2 font-mono text-[9px] text-red-300">
          {locationError}
        </div>
      )}

    </section>
  );
}

export default LocationSelector;

