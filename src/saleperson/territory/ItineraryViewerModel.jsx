import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  X, MapPin, Mail, Phone, User, Clock,
  StickyNote, DollarSign, Calendar, Maximize2, Minimize2,
  ZoomIn, ZoomOut, Navigation, Filter, CheckCircle2, AlertTriangle
} from "lucide-react";
import {
  GoogleMap,
  Polygon,
  Circle,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useGetItineraryByIdQuery } from "../../features/territory/TerritoryApiSlice";
import { useUpdateItineraryHouseInfoMutation } from "../../features/territory/TerritoryApiSlice";

// ----------------------
// Helpers
// ----------------------
const FALLBACK_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const toLatLng = ([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) });
const extractPolygonPath = (polygon) => (polygon?.coordinates?.[0] || []).map(toLatLng);
const normalize = (s) => (s || "").toString().trim().toLowerCase();

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};
const formatNumber = (num) => new Intl.NumberFormat().format(num ?? 0);

// ----------------------
// UI Bits
// ----------------------
const Badge = ({ tone = "blue", children }) => {
  const tones = {
    blue: "bg-blue-900 text-blue-200",
    green: "bg-green-900 text-green-200",
    amber: "bg-amber-900 text-amber-200",
    red: "bg-red-900 text-red-200",
    purple: "bg-purple-900 text-purple-200",
    gray: "bg-gray-700 text-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5 text-blue-400">{icon}</div>
    <div className="flex-1">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-200 truncate" title={value}>
        {value}
      </div>
    </div>
  </div>
);

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1">
    <span className="w-3 h-3 rounded-full" style={{ background: color }} />
    <span className="text-xs text-gray-200">{label}</span>
  </div>
);

// ----------------------
// House Card (Popup only)
// ----------------------
function HouseCard({ house, onClose, onLocalUpdate }) {
  const [notes, setNotes] = useState(house.notes || "");
  const [status, setStatus] = useState(normalize(house.status) || "");
  const [saveHouse, { isLoading, isError, isSuccess, reset }]= useUpdateItineraryHouseInfoMutation();

  useEffect(() => {
    setNotes(house.notes || "");
    setStatus(normalize(house.status) || "");
    reset();
  }, [house, reset]);

  const toneFor = (s) => {
    const v = normalize(s);
    if (v === "visited") return { badge: "green", dot: "#10B981", label: "Visited" };
    if (v === "pending") return { badge: "amber", dot: "#F59E0B", label: "Pending" };
    if (v === "progress" || v === "in progress") return { badge: "purple", dot: "#8B5CF6", label: "Progress" };
    return { badge: "blue", dot: "#3B82F6", label: (house.status || "").toString() };
  };

  const tone = toneFor(status || house.status);

  const handleSave = async () => {
    try {
      const payload = { id: house.id, notes, status };
      const res = await saveHouse(payload).unwrap();
      // Optimistic local update for marker/popup
      const updated = {
        ...house,
        notes,
        status,
        visited_at: status === 'visited' ? (res?.data?.visited_at || new Date().toISOString()) : house.visited_at,
      };
      onLocalUpdate?.(house.id, updated);
    } catch (_e) {
      // handled by isError state
    }
  };

  return (
    <div className="text-sm max-w-sm bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-4 text-white relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg leading-tight">
              {`${house.first_name || ""} ${house.last_name || ""}`.trim() || "Unnamed"}
            </h3>
            <p className="text-blue-200 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{house.address}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isSuccess && (
              <Badge tone="green">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </span>
              </Badge>
            )}
            {isError && (
              <Badge tone="red">
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Error
                </span>
              </Badge>
            )}
          </div>
        </div>
        {(status || house.status) && (
          <div className="mt-2 inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: tone.dot }} />
            <Badge tone={tone.badge}>{tone.label}</Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Static details */}
        <div className="grid grid-cols-2 gap-3">
          {house.city && house.state && (
            <DetailItem icon={<MapPin className="w-4 h-4" />} label="Location" value={`${house.city}, ${house.state}`} />
          )}
          {house.email && <DetailItem icon={<Mail className="w-4 h-4" />} label="Email" value={house.email} />}
          {house.phone && <DetailItem icon={<Phone className="w-4 h-4" />} label="Phone" value={house.phone} />}
          {house.homeowner_confirmed && (
            <DetailItem icon={<User className="w-4 h-4" />} label="Homeowner" value={house.homeowner_confirmed} />
          )}
          {house.visited_at && (
            <DetailItem icon={<Clock className="w-4 h-4" />} label="Last Visited" value={formatDate(house.visited_at)} />
          )}
          {(house.home_value ?? 0) > 0 && (
            <DetailItem icon={<DollarSign className="w-4 h-4" />} label="Home Value" value={`$${formatNumber(house.home_value)}`} />
          )}
          {house.length_of_residence && (
            <DetailItem icon={<Calendar className="w-4 h-4" />} label="Residence" value={`${house.length_of_residence} years`} />
          )}
        </div>

        {/* Editable: only Notes + Status */}
        <div className="pt-2 border-t border-gray-700 space-y-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-gray-400">Status</span>
            <select
              className="rounded-md border-gray-600 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={status}
              onChange={(e) => setStatus(normalize(e.target.value))}
            >
              <option value="">—</option>
              <option value="visited">Visited</option>
              <option value="pending">Pending</option>
              <option value="progress">Progress</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-gray-400">Notes</span>
            <textarea
              rows={3}
              className="rounded-md border-gray-600 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a short note..."
            />
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-800 flex justify-between items-center">
        <div className="text-xs text-gray-400">
          Lat/Lng: {Number(house.latitude).toFixed(5)}, {Number(house.longitude).toFixed(5)}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60"
          >
            {isLoading ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------
// Marker Wrapper
// ----------------------
const CustomMarker = React.memo(({ house, isActive, onClick, onClose, onLocalUpdate }) => {
  const s = normalize(house.status);
  const color = (() => {
    if (s === "visited") return "#10B981"; // green
    if (s === "pending") return "#F59E0B"; // amber
    if (s === "progress") return "#8B5CF6"; // purple
    return isActive ? "#FF5252" : "#4285F4"; // default
  })();

  return (
    <Marker
      position={{ lat: Number(house.latitude), lng: Number(house.longitude) }}
      onClick={() => onClick(house.id)}
      options={{
        optimized: true,
        zIndex: isActive ? 1000 : 2,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: isActive ? 3 : 2,
          scale: isActive ? 11 : 9,
        },
      }}
    >
      {isActive && (
        <InfoWindow
          onCloseClick={onClose}
          options={{ disableAutoPan: true, pixelOffset: new window.google.maps.Size(0, -12), maxWidth: 360 }}
        >
          <HouseCard house={house} onClose={onClose} onLocalUpdate={onLocalUpdate} />
        </InfoWindow>
      )}
    </Marker>
  );
});

// ----------------------
// Main Component
// ----------------------
export default function ItineraryViewerModalGoogleV2({ open, onClose, id, apiKey = FALLBACK_API_KEY }) {
  const { data } = useGetItineraryByIdQuery(id, { skip: !id });
  const [activeHouseId, setActiveHouseId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [map, setMap] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showLegend, setShowLegend] = useState(true);
  const mapRef = useRef(null);
  const fittedRef = useRef(false);
  const initialCenterRef = useRef(null);

  const [itinerary, setItinerary] = useState(null);
  useEffect(() => {
    if (data?.data) setItinerary(data.data);
  }, [data]);

  const item = itinerary;
  const isRadius = normalize(item?.type) === "radius";
  const polygonPath = extractPolygonPath(item?.polygon);

  const housesRaw = useMemo(() => (Array.isArray(item?.houses) ? item.houses : []), [item]);
  const houseStatuses = useMemo(() => {
    const set = new Set(housesRaw.map((h) => normalize(h.status)).filter(Boolean));
    // Ensure the three core statuses are available as filters
    ["visited","pending","progress"].forEach((k)=>set.add(k));
    return ["all", ...Array.from(set)];
  }, [housesRaw]);

  const [houses, setHouses] = useState([]);
  useEffect(() => {
    const filtered = statusFilter === "all"
      ? housesRaw
      : housesRaw.filter((h) => normalize(h.status) === normalize(statusFilter));
    setHouses(filtered);
  }, [housesRaw, statusFilter]);

  const handleLocalUpdate = useCallback((hid, updated) => {
    // update filtered list
    setHouses((prev) => prev.map((h) => (h.id === hid ? { ...h, ...updated } : h)));
    // mirror into the full itinerary cache
    setItinerary((prev) => {
      if (!prev) return prev;
      const newHouses = (prev.houses || []).map((h) => (h.id === hid ? { ...h, ...updated } : h));
      return { ...prev, houses: newHouses };
    });
  }, []);

  const housePoints = useMemo(
    () =>
      houses
        .map((h) => ({ id: h.id, lat: Number(h.latitude), lng: Number(h.longitude), raw: h }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [houses]
  );

  const computedCenter = useMemo(() => {
    if (item?.center_lat && item?.center_lng) return { lat: Number(item.center_lat), lng: Number(item.center_lng) };
    if (polygonPath.length) return polygonPath[0];
    if (housePoints.length) return { lat: housePoints[0].lat, lng: Number(housePoints[0].lng) };
    return { lat: 31.5204, lng: 74.3587 }; // default
  }, [item, polygonPath, housePoints]);

  if (!initialCenterRef.current) initialCenterRef.current = computedCenter;

  const radiusMeters = Number(item?.radius) * 1000 || undefined;

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: ["drawing", "places", "geometry"],
  });

  const fitEverything = useCallback(
    (m) => {
      const g = window.google;
      if (!g || !m) return;
      const bounds = new g.maps.LatLngBounds();
      polygonPath.forEach((c) => bounds.extend(c));
      housePoints.forEach((h) => bounds.extend({ lat: h.lat, lng: h.lng }));
      if (initialCenterRef.current) bounds.extend(initialCenterRef.current);
      if (!bounds.isEmpty()) {
        m.fitBounds(bounds, 100);
        const z = m.getZoom();
        if (z < 12) m.setZoom(12);
      }
    },
    [polygonPath, housePoints]
  );

  const onLoad = useCallback(
    (m) => {
      mapRef.current = m;
      setMap(m);
      setTimeout(() => {
        if (!fittedRef.current) {
          fitEverything(m);
          fittedRef.current = true;
        }
      }, 250);
    },
    [fitEverything]
  );

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setMap(null);
  }, []);

  const zoomIn = useCallback(() => map && map.setZoom(map.getZoom() + 1), [map]);
  const zoomOut = useCallback(() => map && map.setZoom(map.getZoom() - 1), [map]);
  const fitToBounds = useCallback(() => map && fitEverything(map), [map, fitEverything]);
  const closeInfoWindow = useCallback(() => setActiveHouseId(null), []);
  const handleMarkerClick = useCallback((houseId) => setActiveHouseId((prev) => (prev === houseId ? null : houseId)), []);
  const handleClose = useCallback(() => {
    setActiveHouseId(null);
    setIsFullscreen(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && handleClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center ${isFullscreen ? "bg-gray-900" : "bg-black bg-opacity-80"}`}>
      <div className={`relative w-full h-full ${isFullscreen ? "" : "max-w-6xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"}`}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={initialCenterRef.current}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              gestureHandling: "greedy",
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
                { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
                { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
              ]
            }}
          >
            {isRadius && (
              <Circle
                center={initialCenterRef.current}
                radius={radiusMeters}
                options={{
                  fillColor: "#3B82F6",
                  fillOpacity: 0.05,
                  strokeColor: "#2563EB",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  clickable: false,
                  zIndex: 1,
                }}
              />
            )}

            {!isRadius && polygonPath.length > 0 && (
              <Polygon
                paths={polygonPath}
                options={{
                  fillColor: "#3B82F6",
                  fillOpacity: 0.05,
                  strokeColor: "#2563EB",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  clickable: false,
                  zIndex: 1,
                }}
              />
            )}

            {houses.map((h) => (
              <CustomMarker
                key={h.id}
                house={h}
                isActive={activeHouseId === h.id}
                onClick={setActiveHouseId}
                onClose={() => setActiveHouseId(null)}
                onLocalUpdate={handleLocalUpdate}
              />
            ))}
          </GoogleMap>
        )}

        {/* Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-[999]">
          <button onClick={() => map && map.setZoom(map.getZoom() + 1)} className="p-2 bg-gray-800 rounded shadow hover:bg-gray-700 text-gray-200" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => map && map.setZoom(map.getZoom() - 1)} className="p-2 bg-gray-800 rounded shadow hover:bg-gray-700 text-gray-200" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => map && fitEverything(map)} className="p-2 bg-gray-800 rounded shadow hover:bg-gray-700 text-gray-200" title="Fit to Bounds">
            <Navigation className="w-4 h-4" />
          </button>
          <button onClick={() => setIsFullscreen((v) => !v)} className="p-2 bg-gray-800 rounded shadow hover:bg-gray-700 text-gray-200" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => { setActiveHouseId(null); setIsFullscreen(false); onClose?.(); }} className="p-2 bg-gray-800 rounded shadow hover:bg-gray-700 text-gray-200" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toggle */}
        <button onClick={() => setShowFilters((v) => !v)} className="absolute bottom-4 right-4 p-2 bg-gray-800 rounded shadow hover:bg-gray-700 text-gray-200 z-10" title="Toggle Filters">
          <Filter className="w-4 h-4" />
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="absolute bottom-4 left-4 bg-gray-800 rounded-lg shadow p-3 z-10">
            <label className="block text-sm text-gray-300 mb-2">Filter by status</label>
            <select className="border-gray-600 bg-gray-700 text-gray-200 rounded-md text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {houseStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="mt-3 text-xs text-gray-400">
              * Popup supports: Visited, Pending, Progress
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 rounded-lg shadow p-3 flex gap-4 items-center z-10">
          <LegendItem color="#10B981" label="Visited" />
          <LegendItem color="#F59E0B" label="Pending" />
          <LegendItem color="#8B5CF6" label="Progress" />
          <LegendItem color="#4285F4" label="Other" />
        </div>
      </div>
    </div>
  );
}
