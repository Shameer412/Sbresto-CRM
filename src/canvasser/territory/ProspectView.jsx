
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  Polygon,
  Circle,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import { Loader2, MapPin, Home, ZoomIn, ZoomOut, Navigation, Satellite, User } from "lucide-react";
import { useListItineraryItemsQuery } from "../../features/territory/TerritoryApiSlice";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center (fallback)
const defaultZoom = 6;

const toLatLng = ([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) });
const normalize = (s) => (s || "").toString().trim().toLowerCase();
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Calculate distance between two points in kilometers and return as a number
const getDistanceToUser = (houseLat, houseLng, userLat, userLong, houseId) => {
  const point1 = { lat: toNumber(houseLat), lng: toNumber(houseLng) };
  const point2 = { lat: toNumber(userLat), lng: toNumber(userLong) };

  console.log(`getDistanceToUser for house ID ${houseId}:`, { houseLat, houseLng, userLat, userLong, point1, point2 });

  if (!point1.lat || !point1.lng || !point2.lat || !point2.lng) {
    console.error(`Invalid coordinates for house ID ${houseId}`, { point1, point2 });
    return null;
  }

  if (
    point1.lat < -90 || point1.lat > 90 || point1.lng < -180 || point1.lng > 180 ||
    point2.lat < -90 || point2.lat > 90 || point2.lng < -180 || point2.lng > 180
  ) {
    console.error(`Coordinates out of valid range for house ID ${houseId}`, { point1, point2 });
    return null;
  }

  if (!window.google || !window.google.maps || !window.google.maps.geometry) {
    console.error(`Google Maps geometry library not loaded for house ID ${houseId}`);
    return null;
  }

  try {
    const distanceMeters = window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(point1.lat, point1.lng),
      new window.google.maps.LatLng(point2.lat, point2.lng)
    );
    const distanceKm = Number((distanceMeters / 1000).toFixed(2));
    console.log(`Calculated distance for house ID ${houseId}:`, distanceKm);
    return distanceKm;
  } catch (error) {
    console.error(`Error calculating distance for house ID ${houseId}:`, error);
    return null;
  }
};

export default function TerritoryMapViewer() {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(!!window.google?.maps?.geometry);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState("hybrid");
  const [houses, setHouses] = useState([]);
  const mapRef = useRef(null);
  const fittedRef = useRef(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleLoaded = () => {
      if (window.google?.maps?.geometry) {
        console.log("Google Maps geometry library loaded");
        setIsGoogleLoaded(true);
      } else {
        console.log("Google Maps geometry library not loaded yet");
        const timer = setTimeout(checkGoogleLoaded, 500); // Increased timeout
        return () => clearTimeout(timer);
      }
    };
    checkGoogleLoaded();
  }, []);

  // Fetch territories
  const { data, isLoading, isError, error } = useListItineraryItemsQuery({
    page: 1,
    per_page: 100,
  });

  const territories = data?.items ?? [];

  // Compute houses with valid coordinates
  useEffect(() => {
    const computedHouses = territories.flatMap((t) =>
      (t.houses || []).map((h) => {
        const lat = toNumber(h.latitude);
        const lng = toNumber(h.longitude);
        const userLat = toNumber(h.user_lat);
        const userLong = toNumber(h.user_long);
        if (lat == null || lng == null) {
          console.warn(`Invalid house coordinates for house ID ${h.id}`, { latitude: h.latitude, longitude: h.longitude });
          return null;
        }
        const house = { ...h, position: { lat, lng }, itinerary_id: t.id };
        if (userLat != null && userLong != null && isGoogleLoaded) {
          house.userPosition = { lat: userLat, lng: userLong };
          house.distanceToUser = getDistanceToUser(h.latitude, h.longitude, h.user_lat, h.user_long, h.id);
          if (house.distanceToUser === null) {
            console.warn(`Failed to calculate distance for house ID ${h.id}`, { userLat, userLong });
          }
        } else {
          house.distanceToUser = null; // Explicitly set to null for clarity
        }
        return house;
      }).filter(Boolean)
    );
    // Log house ID 397 for debugging
    const house397 = computedHouses.find((h) => h.id === 397);
    if (house397) {
      console.log("House ID 397 data:", house397);
    }
    setHouses(computedHouses);
  }, [territories, isGoogleLoaded]);

  // Recompute distances only when necessary
  useEffect(() => {
    if (isGoogleLoaded && houses.length > 0) {
      const updatedHouses = houses.map((house) => {
        if (house.userPosition && house.distanceToUser === null && toNumber(house.user_lat) != null && toNumber(house.user_long) != null) {
          const distance = getDistanceToUser(
            house.latitude,
            house.longitude,
            house.user_lat,
            house.user_long,
            house.id
          );
          return { ...house, distanceToUser: distance };
        }
        return house;
      });
      setHouses((prevHouses) => {
        // Avoid unnecessary updates
        if (JSON.stringify(prevHouses) !== JSON.stringify(updatedHouses)) {
          console.log("Recalculated distances for houses:", updatedHouses);
          return updatedHouses;
        }
        return prevHouses;
      });
    }
  }, [isGoogleLoaded, houses]);

  // Compute map center
  const mapCenter = useMemo(() => {
    if (territories.length > 0) {
      const t = territories[0];
      if (t.center_lat && t.center_lng) {
        return { lat: Number(t.center_lat), lng: Number(t.center_lng) };
      }
      if (t.polygon?.coordinates?.[0]) {
        const polygonPath = t.polygon.coordinates[0].map(toLatLng);
        const latSum = polygonPath.reduce((sum, p) => sum + p.lat, 0);
        const lngSum = polygonPath.reduce((sum, p) => sum + p.lng, 0);
        return { lat: latSum / polygonPath.length, lng: lngSum / polygonPath.length };
      }
    }
    return defaultCenter;
  }, [territories]);

  // Fit map to bounds
  const fitBounds = useCallback(
    (m) => {
      const g = window.google;
      if (!g || !m || territories.length === 0) return;

      const bounds = new g.maps.LatLngBounds();
      territories.forEach((t) => {
        if (normalize(t.type) === "radius" && t.center_lat && t.center_lng && t.radius) {
          const circle = new g.maps.Circle({
            center: { lat: Number(t.center_lat), lng: Number(t.center_lng) },
            radius: Number(t.radius) * 1000,
          });
          const circleBounds = circle.getBounds();
          if (circleBounds) bounds.union(circleBounds);
        } else if (t.polygon?.coordinates?.[0]) {
          const polygonPath = t.polygon.coordinates[0].map(toLatLng);
          polygonPath.forEach((c) => bounds.extend(c));
        }
      });
      houses.forEach((h) => {
        bounds.extend(h.position);
        if (h.userPosition) bounds.extend(h.userPosition);
      });
      if (!bounds.isEmpty()) {
        m.fitBounds(bounds, 80);
        const listener = g.maps.event.addListener(m, "bounds_changed", () => {
          const zoom = m.getZoom();
          if (zoom > 20) m.setZoom(20);
          g.maps.event.removeListener(listener);
        });
      }
    },
    [territories, houses]
  );

  const onLoad = useCallback(
    (m) => {
      mapRef.current = m;
      setMap(m);
      setTimeout(() => {
        if (!fittedRef.current) {
          fitBounds(m);
          fittedRef.current = true;
        }
      }, 500);
    },
    [fitBounds]
  );

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setMap(null);
    fittedRef.current = false;
  }, []);

  const zoomIn = useCallback(() => map && map.setZoom(map.getZoom() + 1), [map]);
  const zoomOut = useCallback(() => map && map.setZoom(map.getZoom() - 1), [map]);
  const fitToBounds = useCallback(() => map && fitBounds(map), [map, fitBounds]);
  const toggleMapType = useCallback(() => {
    setMapType((prev) => (prev === "hybrid" ? "satellite" : "hybrid"));
  }, []);

  useEffect(() => {
    if (map && territories.length > 0 && !fittedRef.current) {
      setTimeout(() => {
        fitBounds(map);
        fittedRef.current = true;
      }, 300);
    }
  }, [territories, map, fitBounds]);

  if (!isGoogleLoaded) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading map…
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading territories…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-400">
        Failed to load territories. {error?.data?.message || ""}
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          gestureHandling: "greedy",
          mapTypeId: mapType,
          clickableIcons: false,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          zoomControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1d2d50" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8ec3eb" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
            { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "road", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
          ],
        }}
      >
        {/* Territories */}
        {territories.map((territory) => {
          const center = {
            lat: Number(territory.center_lat),
            lng: Number(territory.center_lng),
          };
          const isRadius = normalize(territory.type) === "radius";

          return (
            <React.Fragment key={territory.id}>
              {isRadius && territory.center_lat && territory.center_lng ? (
                <Circle
                  center={center}
                  radius={(territory.radius || 0) * 1000}
                  options={{
                    fillColor: territory.color || "#6366f1",
                    fillOpacity: 0.2,
                    strokeColor: territory.color || "#6366f1",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    clickable: false,
                    zIndex: 1,
                  }}
                />
              ) : territory.polygon?.coordinates?.[0] ? (
                <Polygon
                  paths={territory.polygon.coordinates[0].map(toLatLng)}
                  options={{
                    fillColor: territory.color || "#22c55e",
                    fillOpacity: 0.2,
                    strokeColor: territory.color || "#22c55e",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    clickable: false,
                    zIndex: 1,
                  }}
                />
              ) : null}

              {/* Houses inside territory */}
              {territory.houses?.map((house) => {
                const computedHouse = houses.find((h) => h.id === house.id) || house;
                return (
                  <React.Fragment key={house.id}>
                    <MarkerF
                      position={{
                        lat: Number(house.latitude),
                        lng: Number(house.longitude),
                      }}
                      onClick={() => {
                        setSelectedHouse(computedHouse);
                        setSelectedUser(null);
                        console.log("Selected house:", computedHouse);
                      }}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 6,
                        fillColor: "#f43f5e",
                        fillOpacity: 0.9,
                        strokeColor: "#fff",
                        strokeWeight: 1,
                      }}
                    />
                    {house.user_lat != null && house.user_long != null && (
                      <MarkerF
                        position={{
                          lat: Number(house.user_lat),
                          lng: Number(house.user_long),
                        }}
                        onClick={() => {
                          setSelectedUser(computedHouse);
                          setSelectedHouse(null);
                          console.log("Selected user:", computedHouse);
                        }}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: 6,
                          fillColor: "#10b981",
                          fillOpacity: 0.9,
                          strokeColor: "#fff",
                          strokeWeight: 1,
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* InfoWindow for houses */}
        {selectedHouse && (
          <InfoWindowF
            position={{
              lat: Number(selectedHouse.latitude),
              lng: Number(selectedHouse.longitude),
            }}
            onCloseClick={() => setSelectedHouse(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -10) }}
          >
            <div className="min-w-[200px] text-sm text-gray-800">
              <div className="font-medium flex items-center gap-1 mb-1">
                <Home className="w-4 h-4" /> House #{selectedHouse.id}
              </div>
              {selectedHouse.user_lat != null && selectedHouse.user_long != null ? (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">User Coordinates:</span> {Number(selectedHouse.user_lat).toFixed(4)}, {Number(selectedHouse.user_long).toFixed(4)}
                </div>
              ) : null}
              <div className="text-xs text-gray-600">
                <span className="font-medium">Distance to User:</span> {selectedHouse.distanceToUser != null ? selectedHouse.distanceToUser : "N/A"}
              </div>
            </div>
          </InfoWindowF>
        )}

        {/* InfoWindow for user locations */}
        {selectedUser && (
          <InfoWindowF
            position={{
              lat: Number(selectedUser.user_lat),
              lng: Number(selectedUser.user_long),
            }}
            onCloseClick={() => setSelectedUser(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -10) }}
          >
            <div className="min-w-[200px] text-sm text-gray-800">
              <div className="font-medium flex items-center gap-1 mb-1">
                <User className="w-4 h-4" /> User Location for House #{selectedUser.id}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Coordinates:</span> {Number(selectedUser.user_lat).toFixed(4)}, {Number(selectedUser.user_long).toFixed(4)}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Distance to House:</span> {selectedUser.distanceToUser != null ? selectedUser.distanceToUser : "N/A"}
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Top-left territory info */}
      <div className="absolute top-3 left-3 bg-gray-900/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg z-10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          Territories ({territories.length})
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Houses: {houses.length} | Users: {houses.filter((h) => h.userPosition).length}
        </p>
      </div>

      {/* Right-side map controls */}
      <div className="absolute top-16 right-3 flex flex-col gap-2 z-10">
        <button
          onClick={zoomIn}
          className="p-2 bg-gray-900/90 backdrop-blur-sm rounded-lg shadow hover:bg-gray-800 text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-gray-900/90 backdrop-blur-sm rounded-lg shadow hover:bg-gray-800 text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={fitToBounds}
          className="p-2 bg-gray-900/90 backdrop-blur-sm rounded-lg shadow hover:bg-gray-800 text-white"
          title="Fit to Bounds"
        >
          <Navigation className="w-4 h-4" />
        </button>
        <button
          onClick={toggleMapType}
          className="p-2 bg-gray-900/90 backdrop-blur-sm rounded-lg shadow hover:bg-gray-800 text-white"
          title="Toggle Map Type"
        >
          <Satellite className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
