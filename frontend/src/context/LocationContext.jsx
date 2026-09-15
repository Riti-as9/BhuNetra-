import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const LocationContext = createContext(null);

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

const DEFAULT_LOCATION = {
  latitude: null,
  longitude: null,
  state: null,
  insideNER: null,
};

function roundCoordinate(value) {
  return Number(Number(value).toFixed(5));
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationMode, setLocationMode] = useState("live");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationContext, setLocationContext] = useState(null);
  const [locationError, setLocationError] = useState("");

  const watchIdRef = useRef(null);
  const lastSentLocationRef = useRef(null);
  const locationModeRef = useRef("live");

  // ------------------------------------------------------------
  // Stop browser GPS watcher
  // ------------------------------------------------------------

  const stopLiveLocation = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // ------------------------------------------------------------
  // Resolve coordinates through BhuNetra backend
  // ------------------------------------------------------------

  const resolveLocation = useCallback(
    async (latitude, longitude, mode = locationModeRef.current) => {
      try {
        setLocationStatus("resolving");
        setLocationError("");

        const response = await fetch(`${API_BASE}/location/context`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude,
            longitude,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Location service returned ${response.status}`
          );
        }

        const data = await response.json();

        // Ignore an old GPS response if the user has already
        // manually selected another location.
        if (
          mode === "live" &&
          locationModeRef.current !== "live"
        ) {
          return null;
        }

        const resolvedLocation = {
          latitude,
          longitude,
          state: data.location?.state ?? null,
          insideNER: data.inside_ner === true,
        };

        setLocation(resolvedLocation);
        setLocationContext(data);
        setLocationStatus("ready");

        return data;
      } catch (error) {
        console.error("BhuNetra location error:", error);

        setLocationStatus("error");
        setLocationError(
          error instanceof Error
            ? error.message
            : "Unable to resolve location."
        );

        return null;
      }
    },
    []
  );

  // ------------------------------------------------------------
  // Handle GPS position
  // ------------------------------------------------------------

  const handlePosition = useCallback(
    async (position) => {
      // If manual mode is active, GPS must never overwrite it.
      if (locationModeRef.current !== "live") {
        return;
      }

      const latitude = roundCoordinate(
        position.coords.latitude
      );

      const longitude = roundCoordinate(
        position.coords.longitude
      );

      const previous = lastSentLocationRef.current;

      // Ignore tiny GPS fluctuations.
      if (previous) {
        const latitudeChanged =
          Math.abs(previous.latitude - latitude) >= 0.001;

        const longitudeChanged =
          Math.abs(previous.longitude - longitude) >= 0.001;

        if (!latitudeChanged && !longitudeChanged) {
          return;
        }
      }

      lastSentLocationRef.current = {
        latitude,
        longitude,
      };

      await resolveLocation(
        latitude,
        longitude,
        "live"
      );
    },
    [resolveLocation]
  );

  // ------------------------------------------------------------
  // GPS error handler
  // ------------------------------------------------------------

  const handlePositionError = useCallback((error) => {
    console.error("Browser geolocation error:", error);

    setLocationStatus("error");

    if (error.code === 1) {
      setLocationError(
        "Location permission was denied. You can select a location manually."
      );
    } else if (error.code === 2) {
      setLocationError(
        "Your current location could not be determined."
      );
    } else if (error.code === 3) {
      setLocationError(
        "Location request timed out."
      );
    } else {
      setLocationError(
        "Unable to access your current location."
      );
    }
  }, []);

  // ------------------------------------------------------------
  // Start live GPS tracking
  // ------------------------------------------------------------

  const startLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    // Kill any previous watcher first.
    stopLiveLocation();

    locationModeRef.current = "live";
    setLocationMode("live");
    setLocationStatus("requesting");
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        handlePosition,
        handlePositionError,
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 20000,
        }
      );
  }, [
    handlePosition,
    handlePositionError,
    stopLiveLocation,
  ]);

  // ------------------------------------------------------------
  // Manually select a location
  // ------------------------------------------------------------

  const selectLocation = useCallback(
    async (latitude, longitude) => {
      // Immediately switch to manual mode.
      // This prevents the GPS watcher from racing with the
      // selected location.
      locationModeRef.current = "selected";
      setLocationMode("selected");

      stopLiveLocation();

      const normalizedLatitude =
        roundCoordinate(latitude);

      const normalizedLongitude =
        roundCoordinate(longitude);

      // Immediately update the UI with the selected coordinates.
      // Do NOT wait for the backend response.
      setLocation({
        latitude: normalizedLatitude,
        longitude: normalizedLongitude,
        state: null,
        insideNER: null,
      });

      setLocationContext(null);
      setLocationStatus("resolving");
      setLocationError("");

      lastSentLocationRef.current = {
        latitude: normalizedLatitude,
        longitude: normalizedLongitude,
      };

      return resolveLocation(
        normalizedLatitude,
        normalizedLongitude,
        "selected"
      );
    },
    [resolveLocation, stopLiveLocation]
  );

  // ------------------------------------------------------------
  // Return to physical location
  // ------------------------------------------------------------

  const useCurrentLocation = useCallback(() => {
    startLiveLocation();
  }, [startLiveLocation]);

  // ------------------------------------------------------------
  // Automatically request current location
  // ------------------------------------------------------------

  useEffect(() => {
    startLiveLocation();

    return () => {
      stopLiveLocation();
    };
  }, [startLiveLocation, stopLiveLocation]);

  // ------------------------------------------------------------
  // Central location state
  // ------------------------------------------------------------

  const value = useMemo(
    () => ({
      location,

      locationMode,
      locationStatus,

      locationContext,
      locationError,

      isInsideNER:
        location.insideNER === true,

      nearestZone:
        locationContext?.nearest_zone ?? null,

      useCurrentLocation,
      selectLocation,

      startLiveLocation,
      stopLiveLocation,
    }),
    [
      location,
      locationMode,
      locationStatus,
      locationContext,
      locationError,
      useCurrentLocation,
      selectLocation,
      startLiveLocation,
      stopLiveLocation,
    ]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// ------------------------------------------------------------
// Application location hook
// ------------------------------------------------------------

export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error(
      "useLocation must be used inside LocationProvider."
    );
  }

  return context;
}

export default LocationContext;
