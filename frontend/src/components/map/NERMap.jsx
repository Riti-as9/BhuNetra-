import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import { motion } from "framer-motion";
import L from "leaflet";
import { getRiskColor } from "../../utils/riskUtils";
import { useLocation } from "../../context/LocationContext";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1"

const NER_CENTER = [26.2, 92.8];

const MapResizeHandler = () => {
  const map = useMap();

  useEffect(() => {
    let t1;
    let t2;
    let ro;

    const resize = () => {
      map.invalidateSize({
        animate: false,
        pan: false,
      });
    };

    t1 = setTimeout(resize, 50);
    t2 = setTimeout(resize, 400);

    window.addEventListener("resize", resize);

    if (
      typeof ResizeObserver !== "undefined" &&
      map.getContainer?.()
    ) {
      ro = new ResizeObserver(resize);
      ro.observe(map.getContainer());
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", resize);

      if (ro) {
        ro.disconnect();
      }
    };
  }, [map]);

  return null;
};

// ------------------------------------------------------------
// Initial NER bounds
//
// Only fits the complete NER overview when there is no
// user-selected/current location yet.
// ------------------------------------------------------------

const BoundsController = ({
  inventory,
  zones,
  hasFocusedLocation,
}) => {
  const map = useMap();

  useEffect(() => {
    if (hasFocusedLocation) {
      return;
    }

    const invPoints = inventory
      .slice(0, 2000)
      .flatMap((feature) => {
        const coordinates =
          feature.geometry?.coordinates;

        return coordinates?.length >= 2
          ? [[coordinates[1], coordinates[0]]]
          : [];
      });

    const zonePoints = zones.flatMap((zone) => {
      const [lat, lng] =
        zone.coordinates || [];

      return typeof lat === "number" &&
        typeof lng === "number"
        ? [[lat, lng]]
        : [];
    });

    const all = [
      ...zonePoints,
      ...invPoints,
    ];

    if (all.length >= 2) {
      try {
        const bounds = L.latLngBounds(all);

        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 8,
        });
      } catch {}
    } else if (zonePoints.length === 1) {
      map.setView(zonePoints[0], 7);
    }
  }, [
    inventory,
    zones,
    map,
    hasFocusedLocation,
  ]);

  return null;
};

// ------------------------------------------------------------
// Location focus controller
//
// This is the key part that makes manual/live location
// actually control the Dashboard map.
// ------------------------------------------------------------

const LocationFocusController = () => {
  const map = useMap();

  const {
    location,
    locationMode,
    locationStatus,
    nearestZone,
  } = useLocation();

  useEffect(() => {
    if (
      locationStatus !== "ready" &&
      locationStatus !== "resolving"
    ) {
      return;
    }

    if (
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      return;
    }

    const target = [
      location.latitude,
      location.longitude,
    ];

    // Manual selection gets a closer zoom.
    // Live GPS stays slightly wider so nearby context
    // remains visible.
    const zoom =
      locationMode === "selected"
        ? 12
        : 11;

    map.flyTo(target, zoom, {
      duration: 1.1,
      easeLinearity: 0.25,
    });
  }, [
    location.latitude,
    location.longitude,
    locationMode,
    locationStatus,
    map,
    nearestZone?.id,
  ]);

  return null;
};

// ------------------------------------------------------------
// Risk tooltip
// ------------------------------------------------------------

const RiskTooltip = ({ zone }) => {
  const color = getRiskColor(
    zone.riskLevel
  );

  return (
    <div
      style={{
        minWidth: 200,
        fontFamily:
          "'JetBrains Mono', monospace",
      }}
    >
      <div
        className="px-3 py-2 border-b border-[#232b3a]"
        style={{
          background: `${color}12`,
        }}
      >
        <div
          className="text-xs font-semibold"
          style={{ color }}
        >
          {zone.name}
        </div>

        <div className="text-[10px] text-[#8892a4] mt-0.5">
          {zone.state} · {zone.id}
        </div>
      </div>

      <div className="px-3 py-2 space-y-1 text-[10px] text-[#8892a4]">
        <div className="flex justify-between">
          <span>RISK</span>
          <b style={{ color }}>
            {zone.riskScore ?? "--"}%
          </b>
        </div>

        <div className="flex justify-between">
          <span>RAINFALL / 24H</span>
          <b className="text-cyber">
            {zone.rainfall_mm ?? "--"} mm
          </b>
        </div>

        <div className="flex justify-between">
          <span>SOIL MOISTURE</span>
          <b className="text-cyber">
            {zone.soilMoisture_pct ?? "--"}%
          </b>
        </div>

        <div className="flex justify-between">
          <span>GSI HISTORY</span>
          <b className="text-cyber">
            {zone.historical_landslides ?? 0}
          </b>
        </div>

        <div className="text-[9px] text-[#4a5568] pt-1">
          BhuNetra live monitoring context
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// User location marker
// ------------------------------------------------------------

const UserLocationMarker = () => {
  const {
    location,
    locationMode,
    locationStatus,
    isInsideNER,
    nearestZone,
  } = useLocation();

  if (
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  ) {
    return null;
  }

  const isResolving =
    locationStatus === "resolving" ||
    locationStatus === "requesting";

  return (
    <>
      {/* Outer accuracy/focus ring */}
      <CircleMarker
        center={[
          location.latitude,
          location.longitude,
        ]}
        radius={22}
        pathOptions={{
          color: "#00d4ff",
          fillColor: "#00d4ff",
          fillOpacity: 0.08,
          weight: 1,
          opacity: 0.45,
        }}
        interactive={false}
      />

      {/* Main user marker */}
      <CircleMarker
        center={[
          location.latitude,
          location.longitude,
        ]}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#00d4ff",
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Tooltip
          direction="top"
          offset={[0, -8]}
          opacity={1}
        >
          <div
            style={{
              minWidth: 210,
              fontFamily:
                "'JetBrains Mono', monospace",
            }}
          >
            <div className="px-3 py-2 border-b border-[#232b3a]">
              <div className="text-xs font-semibold text-cyber">
                {locationMode === "live"
                  ? "LIVE USER LOCATION"
                  : "SELECTED LOCATION"}
              </div>

              <div className="text-[10px] text-[#8892a4] mt-1">
                {location.latitude.toFixed(5)},{" "}
                {location.longitude.toFixed(5)}
              </div>
            </div>

            <div className="px-3 py-2 space-y-1 text-[10px] text-[#8892a4]">
              <div className="flex justify-between">
                <span>REGION</span>
                <b className="text-white">
                  {isInsideNER
                    ? location.state || "NER"
                    : "Outside NER"}
                </b>
              </div>

              <div className="flex justify-between">
                <span>STATUS</span>
                <b className="text-cyber">
                  {isResolving
                    ? "RESOLVING"
                    : "CONNECTED"}
                </b>
              </div>

              {nearestZone && (
                <div className="flex justify-between">
                  <span>NEAREST ZONE</span>
                  <b className="text-cyber">
                    {nearestZone.id}
                  </b>
                </div>
              )}

              {!isInsideNER &&
                location.insideNER === false && (
                  <div className="text-[9px] text-[#8892a4] pt-1">
                    Location is outside the BhuNetra
                    NER monitoring region. NER
                    monitoring data remains unchanged.
                  </div>
                )}
            </div>
          </div>
        </Tooltip>
      </CircleMarker>
    </>
  );
};

// ------------------------------------------------------------
// Selected-location context panel on the map
// ------------------------------------------------------------

const LocationContextOverlay = ({ liveZones }) => {
  const {
    location,
    locationMode,
    locationStatus,
    isInsideNER,
    nearestZone,
  } = useLocation();

  if (
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  ) {
    return null;
  }

  // The location API identifies the nearest monitored zone.
  // The WebSocket contains the current live risk data for
  // that zone. Join the two sources here.
  const liveNearestZone = nearestZone
    ? liveZones.find(
        (zone) => zone.id === nearestZone.id
      )
    : null;

  const contextualZone = liveNearestZone
    ? {
        ...nearestZone,
        ...liveNearestZone,
      }
    : nearestZone;

  const risk =
    contextualZone?.riskScore ??
    contextualZone?.risk_score;

  const riskLevel =
    contextualZone?.riskLevel ??
    contextualZone?.risk_level ??
    "";

  const rainfall =
    contextualZone?.rainfall_mm ??
    contextualZone?.rainfall_24h;

  const soilMoisture =
    contextualZone?.soilMoisture_pct ??
    contextualZone?.soil_moisture;

  const historicalLandslides =
    contextualZone?.historical_landslides ??
    contextualZone?.historicalLandslides ??
    0;

  const riskColor =
    risk != null
      ? getRiskColor(
          String(riskLevel).toLowerCase()
        )
      : "#8892a4";

  return (
    <div className="absolute z-[500] top-2 right-2 w-[270px] max-w-[calc(100%-16px)]">
      <div className="rounded-lg border border-cyber/25 bg-[#0d1117]/95 backdrop-blur-md shadow-xl overflow-hidden">

        {/* Header */}
        <div className="px-3 py-2 border-b border-base-border flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyber">
              Location Intelligence
            </div>

            <div className="text-[11px] font-semibold text-white mt-0.5">
              {locationMode === "live"
                ? "Live Position"
                : "Selected Position"}
            </div>
          </div>

          <div
            className={`w-2 h-2 rounded-full ${
              locationStatus === "ready"
                ? "bg-cyber animate-pulse"
                : locationStatus === "error"
                  ? "bg-critical"
                  : "bg-yellow-400 animate-pulse"
            }`}
          />
        </div>

        <div className="px-3 py-2 space-y-2">

          {/* Coordinates */}
          <div className="text-[10px] font-mono text-text-secondary">
            {location.latitude.toFixed(5)}
            {" · "}
            {location.longitude.toFixed(5)}
          </div>

          {/* Region */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-text-muted">
              Monitoring Region
            </span>

            <span
              className={`text-[10px] font-semibold ${
                isInsideNER
                  ? "text-cyber"
                  : location.insideNER === false
                    ? "text-yellow-400"
                    : "text-text-secondary"
              }`}
            >
              {isInsideNER
                ? location.state || "NER"
                : location.insideNER === false
                  ? "OUTSIDE NER"
                  : "CHECKING"}
            </span>
          </div>

          {/* NER contextual intelligence */}
          {isInsideNER && contextualZone && (
            <>
              {/* Nearest zone */}
              <div className="border-t border-base-border pt-2">
                <div className="text-[9px] uppercase tracking-wider text-text-muted">
                  Nearest Monitored Zone
                </div>

                <div className="text-[11px] font-semibold text-white mt-0.5">
                  {contextualZone.name}
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <div className="text-[9px] text-text-secondary">
                    {contextualZone.distance_km != null
                      ? `${Number(
                          contextualZone.distance_km
                        ).toFixed(1)} km away`
                      : "Distance unavailable"}
                  </div>

                  <div className="text-[9px] font-mono text-cyber">
                    {contextualZone.id}
                  </div>
                </div>
              </div>

              {/* Live risk + GSI history */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-base-border bg-black/20 p-2">
                  <div className="text-[8px] text-text-muted">
                    LIVE RISK
                  </div>

                  <div
                    className="text-sm font-bold mt-0.5"
                    style={{
                      color: riskColor,
                    }}
                  >
                    {risk != null
                      ? `${Number(risk).toFixed(1)}%`
                      : "--"}
                  </div>

                  {riskLevel && (
                    <div
                      className="text-[8px] uppercase mt-0.5"
                      style={{
                        color: riskColor,
                      }}
                    >
                      {String(
                        riskLevel
                      ).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="rounded border border-base-border bg-black/20 p-2">
                  <div className="text-[8px] text-text-muted">
                    GSI HISTORY
                  </div>

                  <div className="text-sm font-bold text-cyber mt-0.5">
                    {historicalLandslides}
                  </div>

                  <div className="text-[8px] text-text-muted mt-0.5">
                    historical events
                  </div>
                </div>
              </div>

              {/* Environmental context */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-base-border bg-black/20 px-2 py-1.5">
                  <div className="text-[8px] text-text-muted">
                    RAINFALL / 24H
                  </div>

                  <div className="text-[10px] font-semibold text-cyber mt-0.5">
                    {rainfall != null
                      ? `${Number(rainfall).toFixed(1)} mm`
                      : "--"}
                  </div>
                </div>

                <div className="rounded border border-base-border bg-black/20 px-2 py-1.5">
                  <div className="text-[8px] text-text-muted">
                    SOIL MOISTURE
                  </div>

                  <div className="text-[10px] font-semibold text-cyber mt-0.5">
                    {soilMoisture != null
                      ? `${Number(soilMoisture).toFixed(1)}%`
                      : "--"}
                  </div>
                </div>
              </div>

              {/* Data relationship */}
              <div className="rounded border border-cyber/15 bg-cyber/5 px-2 py-1.5">
                <div className="text-[8px] uppercase tracking-wider text-cyber">
                  Contextual Prediction
                </div>

                <div className="text-[9px] leading-relaxed text-text-secondary mt-1">
                  Live XGBoost assessment from{" "}
                  <span className="text-white font-semibold">
                    {contextualZone.name}
                  </span>{" "}
                  is used as the nearest monitored-zone
                  risk context for this location.
                </div>
              </div>
            </>
          )}

          {/* Outside NER */}
          {!isInsideNER &&
            location.insideNER === false && (
              <div className="rounded border border-yellow-400/20 bg-yellow-400/5 px-2 py-2 text-[9px] leading-relaxed text-yellow-300/80">
                This location is outside the BhuNetra
                NER monitoring region. The user's position
                is shown, but NER monitoring data is not
                replaced with fabricated values.
              </div>
            )}

          {/* Waiting for nearest-zone live data */}
          {isInsideNER &&
            nearestZone &&
            !liveNearestZone && (
              <div className="rounded border border-yellow-400/20 bg-yellow-400/5 px-2 py-2 text-[9px] leading-relaxed text-yellow-300/80">
                Nearest monitored zone identified.
                Waiting for its live monitoring update...
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// Main map
// ------------------------------------------------------------

export const NERMap = ({
  zones,
  onZoneClick,
  selectedZoneId,
}) => {
  const [inventory, setInventory] = useState([]);
  const [liveZones, setLiveZones] = useState(
    zones || []
  );
  const [wsStatus, setWsStatus] =
    useState("connecting");
  const [inventoryError, setInventoryError] =
    useState("");

  const {
    location,
    locationMode,
  } = useLocation();

  // ----------------------------------------------------------
  // Keep incoming zones synchronized
  // ----------------------------------------------------------

  useEffect(() => {
    if (Array.isArray(zones) && zones.length) {
      setLiveZones((current) => {
        if (!current.length) {
          return zones;
        }

        return current.map((existing) => {
          const updated = zones.find(
            (zone) => zone.id === existing.id
          );

          return updated
            ? {
                ...existing,
                ...updated,
              }
            : existing;
        });
      });
    }
  }, [zones]);

  // ----------------------------------------------------------
  // WebSocket live monitoring
  // ----------------------------------------------------------

  useEffect(() => {
    const wsUrl =
      API_BASE
        .replace(/^http/, "ws")
        .replace(/\/api\/v1$/, "") +
      "/ws/monitoring";

    let socket;
    let reconnectTimer;
    let stopped = false;

    const connect = () => {
      if (stopped) {
        return;
      }

      try {
        socket = new WebSocket(wsUrl);
      } catch (error) {
        console.error(
          "BhuNetra WebSocket connection error:",
          error
        );

        setWsStatus("disconnected");

        reconnectTimer = setTimeout(
          connect,
          3000
        );

        return;
      }

      socket.onopen = () => {
        setWsStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const data =
            JSON.parse(event.data);

          if (
            data.type === "monitoring_update" &&
            Array.isArray(data.zones)
          ) {
            setLiveZones(
              data.zones.map((zone) => ({
                ...zone,

                riskScore:
                  zone.risk_score ??
                  zone.riskScore,

                riskLevel: (
                  zone.risk_level ??
                  zone.riskLevel ??
                  ""
                ).toLowerCase(),

                rainfall_mm:
                  zone.rainfall_24h ??
                  zone.rainfall_mm,

                soilMoisture_pct:
                  zone.soil_moisture ??
                  zone.soilMoisture_pct,

                historical_landslides:
                  zone.historical_landslides ??
                  zone.historicalLandslides ??
                  0,
              }))
            );
          }
        } catch (error) {
          console.error(
            "BhuNetra WebSocket message error:",
            error
          );
        }
      };

      socket.onerror = () => {
        setWsStatus("disconnected");
      };

      socket.onclose = () => {
        setWsStatus("disconnected");

        if (!stopped) {
          reconnectTimer = setTimeout(
            connect,
            3000
          );
        }
      };
    };

    connect();

    return () => {
      stopped = true;

      clearTimeout(reconnectTimer);

      if (socket) {
        socket.close();
      }
    };
  }, []);

  // ----------------------------------------------------------
  // Load GSI inventory
  // ----------------------------------------------------------

  useEffect(() => {
    let active = true;

    fetch(
      `${API_BASE}/monitoring/inventory`
    )
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject()
      )
      .then((data) => {
        if (active) {
          setInventory(
            data.features || []
          );
        }
      })
      .catch(() => {
        if (active) {
          setInventoryError(
            "GSI inventory unavailable"
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const hasFocusedLocation =
    typeof location.latitude === "number" &&
    typeof location.longitude === "number";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full min-h-[320px] sm:min-h-[380px] md:min-h-[460px] rounded-lg overflow-hidden border border-base-border relative"
      style={{
        boxShadow:
          "0 0 40px rgba(0,212,255,.06)",
      }}
    >
      <MapContainer
        center={NER_CENTER}
        zoom={6}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "320px",
          background: "#0d1117",
        }}
        zoomControl
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={18}
        />

        <MapResizeHandler />

        <BoundsController
          inventory={inventory}
          zones={liveZones}
          hasFocusedLocation={
            hasFocusedLocation
          }
        />

        <LocationFocusController />

        {/* -------------------------------------------------- */}
        {/* GSI historical landslide inventory                 */}
        {/* -------------------------------------------------- */}

        {inventory.map(
          (feature, index) => {
            const coordinates =
              feature.geometry?.coordinates;

            if (
              !coordinates ||
              coordinates.length < 2
            ) {
              return null;
            }

            const properties =
              feature.properties || {};

            return (
              <CircleMarker
                key={
                  properties.Sl_No ||
                  index
                }
                center={[
                  coordinates[1],
                  coordinates[0],
                ]}
                radius={3}
                pathOptions={{
                  color: "#a61b3b",
                  fillColor: "#ef476f",
                  fillOpacity: 0.55,
                  weight: 1,
                }}
              >
                <Tooltip direction="top">
                  <span className="font-mono text-xs">
                    GSI historical record ·{" "}
                    {properties.State ||
                      "NER"}
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          }
        )}

        {/* -------------------------------------------------- */}
        {/* Live monitored zones                               */}
        {/* -------------------------------------------------- */}

        {liveZones.map((zone) => {
          if (
            !zone.coordinates ||
            zone.coordinates.length < 2
          ) {
            return null;
          }

          const color =
            getRiskColor(
              zone.riskLevel
            );

          const selected =
            zone.id === selectedZoneId;

          return (
            <CircleMarker
              key={zone.id}
              center={zone.coordinates}
              radius={
                selected ? 15 : 11
              }
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.86,
                weight:
                  selected ? 3 : 2,
              }}
              eventHandlers={{
                click: () =>
                  onZoneClick?.(
                    zone.id
                  ),
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -10]}
                opacity={1}
                className="bhunetra-tooltip"
              >
                <RiskTooltip
                  zone={zone}
                />
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* -------------------------------------------------- */}
        {/* User / selected location                           */}
        {/* -------------------------------------------------- */}

        <UserLocationMarker />
      </MapContainer>

      {/* ---------------------------------------------------- */}
      {/* Location intelligence overlay                       */}
      {/* ---------------------------------------------------- */}

      <LocationContextOverlay liveZones={liveZones} />

      {/* ---------------------------------------------------- */}
      {/* Map status                                           */}
      {/* ---------------------------------------------------- */}

      <div className="absolute z-[500] bottom-2 left-2 px-2 py-1 rounded bg-base-card/95 border border-base-border font-mono text-xxs text-text-secondary">
        {inventory.length.toLocaleString()} GSI
        events · {liveZones.length} LIVE zones ·{" "}
        {wsStatus === "connected"
          ? "LIVE"
          : wsStatus === "connecting"
            ? "CONNECTING"
            : "OFFLINE"}
        {locationMode === "selected"
          ? " · LOCATION SELECTED"
          : ""}
      </div>

      {inventoryError && (
        <div className="absolute z-[500] top-2 left-2 px-2 py-1 rounded bg-critical/15 border border-critical/30 font-mono text-xxs text-critical">
          {inventoryError}
        </div>
      )}
    </motion.div>
  );
};

export default NERMap;
