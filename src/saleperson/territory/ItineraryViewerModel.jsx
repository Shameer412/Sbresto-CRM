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

// ----------------------
// Helpers
// ----------------------
const FALLBACK_API_KEY = "AIzaSyAbYMI1QRvJhV1tRFRdMIGvPj2wP3p358Q";

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

const isValidDate = (d) => d instanceof Date && !isNaN(d);
const toLocalInputValue = (raw) => {
  if (!raw) return "";
  let d = null;
  if (raw instanceof Date) d = raw;
  else if (typeof raw === "number") d = new Date(raw);
  else if (typeof raw === "string") {
    let s = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(s)) s = s.replace(" ", "T");
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s = `${s}T00:00`;
    d = new Date(s);
  }
  if (!isValidDate(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`; // local time for datetime-local
};
const fromLocalInputValueToISO = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isValidDate(d) ? d.toISOString() : "";
};

// ----------------------
// UI Bits
// ----------------------
const Badge = ({ tone = "blue", children }) => {
  const tones = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
    gray: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5">{icon}</div>
    <div className="flex-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-800 truncate" title={value}>
        {value}
      </div>
    </div>
  </div>
);

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1">
    <span className="w-3 h-3 rounded-full" style={{ background: color }} />
    <span className="text-xs">{label}</span>
  </div>
);

// ----------------------
// House Card
// ----------------------
function HouseCard({ house, onClose, onSave }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState(() => ({
    first_name: house.first_name || "",
    last_name: house.last_name || "",
    address: house.address || "",
    city: house.city || "",
    state: house.state || "",
    email: house.email || "",
    phone: house.phone || "",
    status: house.status || "",
    notes: house.notes || "",
    visited_at: house.visited_at || "",
    homeowner_confirmed: house.homeowner_confirmed || "",
    length_of_residence: String(house.length_of_residence ?? ""),
    home_value: house.home_value ?? 0,
  }));

  useEffect(() => {
    setForm((f) => ({
      ...f,
      first_name: house.first_name || "",
      last_name: house.last_name || "",
      address: house.address || "",
      city: house.city || "",
      state: house.state || "",
      email: house.email || "",
      phone: house.phone || "",
      status: house.status || "",
      notes: house.notes || "",
      visited_at: house.visited_at || "",
      homeowner_confirmed: house.homeowner_confirmed || "",
      length_of_residence: String(house.length_of_residence ?? ""),
      home_value: house.home_value ?? 0,
    }));
  }, [house]);

  const statusTone = (() => {
    const s = normalize(house.status || form.status);
    if (s.includes("visited")) return { badge: "green", dot: "#10B981" };
    if (s.includes("not home")) return { badge: "amber", dot: "#F59E0B" };
    if (s.includes("do not call")) return { badge: "red", dot: "#EF4444" };
    if (s.includes("interested")) return { badge: "purple", dot: "#8B5CF6" };
    return { badge: "blue", dot: "#3B82F6" };
  })();

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const doSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = {
        ...form,
        visited_at: fromLocalInputValueToISO(form.visited_at),
        length_of_residence: form.length_of_residence === "" ? null : Number(form.length_of_residence),
      };

      const urlGuess = `/api/houses/${house.id}`; // TODO: replace with actual endpoint
      const res = await fetch(urlGuess, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);

      // Optimistic update regardless
      onSave?.(house.id, payload);

      if (!res || !res.ok) {
        // Optionally handle non-200 here
      }

      setSaved(true);
      setEditing(false);
    } catch (e) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="text-sm max-w-sm bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg leading-tight">
              {`${form.first_name || ""} ${form.last_name || ""}`.trim() || "Unnamed"}
            </h3>
            <p className="text-blue-100 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{form.address}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            {saved && (
              <Badge tone="green">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </span>
              </Badge>
            )}
            {error && (
              <Badge tone="red">
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Error
                </span>
              </Badge>
            )}
          </div>
        </div>
        {(house.status || form.status) && (
          <div className="mt-2 inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusTone.dot }} />
            <Badge tone={statusTone.badge}>{house.status || form.status}</Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">First name</span>
                <input className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">Last name</span>
                <input className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs">
              <span className="text-gray-500">Address</span>
              <input className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" value={form.address} onChange={(e) => update("address", e.target.value)} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">City</span>
                <input className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" value={form.city} onChange={(e) => update("city", e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">State</span>
                <input className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" value={form.state} onChange={(e) => update("state", e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">Email</span>
                <input className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">Phone</span>
                <input className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">Status</span>
                <select className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" value={form.status} onChange={(e) => update("status", e.target.value)}>
                  <option value="">—</option>
                  {[
                    "visited",
                    "not home",
                    "interested",
                    "do not call",
                    "follow up",
                    "left flyer",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">Visited at</span>
                <input
                  type="datetime-local"
                  className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={toLocalInputValue(form.visited_at)}
                  onChange={(e) => update("visited_at", e.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">Homeowner confirmed</span>
                <select
                  className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={String(form.homeowner_confirmed || "")}
                  onChange={(e) => update("homeowner_confirmed", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="TRUE">TRUE</option>
                  <option value="FALSE">FALSE</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-gray-500">Residence length (years)</span>
                <input
                  type="number"
                  min="0"
                  className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={form.length_of_residence}
                  onChange={(e) => update("length_of_residence", e.target.value)}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs">
              <span className="text-gray-500">Notes</span>
              <textarea rows={3} className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {house.city && house.state && (
                <DetailItem icon={<MapPin className="w-4 h-4 text-blue-600" />} label="Location" value={`${house.city}, ${house.state}`} />
              )}
              {house.email && <DetailItem icon={<Mail className="w-4 h-4 text-blue-600" />} label="Email" value={house.email} />}
              {house.phone && <DetailItem icon={<Phone className="w-4 h-4 text-blue-600" />} label="Phone" value={house.phone} />}
              {house.homeowner_confirmed && (
                <DetailItem icon={<User className="w-4 h-4 text-blue-600" />} label="Homeowner" value={house.homeowner_confirmed} />
              )}
              {house.visited_at && (
                <DetailItem icon={<Clock className="w-4 h-4 text-blue-600" />} label="Last Visited" value={formatDate(house.visited_at)} />
              )}
              {(house.home_value ?? 0) > 0 && (
                <DetailItem icon={<DollarSign className="w-4 h-4 text-blue-600" />} label="Home Value" value={`$${formatNumber(house.home_value)}`} />
              )}
              {house.length_of_residence && (
                <DetailItem icon={<Calendar className="w-4 h-4 text-blue-600" />} label="Residence" value={`${house.length_of_residence} years`} />
              )}
            </div>

            {house.notes && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <StickyNote className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Notes</p>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{house.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Lat/Lng: {Number(house.latitude).toFixed(5)}, {Number(house.longitude).toFixed(5)}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-2.5 py-1.5 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-1">
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button onClick={doSave} disabled={saving} className="px-2.5 py-1.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 disabled:opacity-60">
                {saving ? <span className="w-4 h-4 animate-spin">⟳</span> : <span className="w-4 h-4">💾</span>}
                Save
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="px-2.5 py-1.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1">
                <span className="w-4 h-4">✎</span>
                Edit
              </button>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------
// Marker Wrapper
// ----------------------
const CustomMarker = React.memo(({ house, isActive, onClick, onClose }) => {
  const s = normalize(house.status);
  const color = (() => {
    if (s.includes("visited")) return "#10B981";
    if (s.includes("not home")) return "#F59E0B";
    if (s.includes("do not call")) return "#EF4444";
    if (s.includes("interested")) return "#8B5CF6";
    return isActive ? "#FF5252" : "#4285F4";
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
          <HouseCard house={house} onClose={onClose} onSave={(id, payload) => house.__onSave?.(id, payload)} />
        </InfoWindow>
      )}
    </Marker>
  );
});

// ----------------------
// Main Component
// ----------------------
export default function ItineraryViewerModalGoogleV2({ open, onClose, id, apiKey = FALLBACK_API_KEY, onSaveHouse }) {
  const { data, isLoading } = useGetItineraryByIdQuery(id, { skip: !id });
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
    return ["all", ...Array.from(set)];
  }, [housesRaw]);

  const houses = useMemo(
    () => (statusFilter === "all" ? housesRaw : housesRaw.filter((h) => normalize(h.status) === normalize(statusFilter))),
    [housesRaw, statusFilter]
  );

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
    return { lat: 31.5204, lng: 74.3587 }; // Lahore as a safe default
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
  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), []);
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
    <div className={`fixed inset-0 z-[999] flex items-center justify-center ${isFullscreen ? "bg-white" : "bg-black bg-opacity-50"}`}>
      <div className={`relative w-full h-full ${isFullscreen ? "" : "max-w-6xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"}`}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={initialCenterRef.current}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{ gestureHandling: "greedy" }}
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
                house={{ ...h, __onSave: onSaveHouse }}
                isActive={activeHouseId === h.id}
                onClick={handleMarkerClick}
                onClose={closeInfoWindow}
              />
            ))}
          </GoogleMap>
        )}

        {/* Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-[999]">
          <button onClick={zoomIn} className="p-2 bg-white rounded shadow hover:bg-gray-100" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={zoomOut} className="p-2 bg-white rounded shadow hover:bg-gray-100" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={fitToBounds} className="p-2 bg-white rounded shadow hover:bg-gray-100" title="Fit to Bounds">
            <Navigation className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 bg-white rounded shadow hover:bg-gray-100" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={handleClose} className="p-2 bg-white rounded shadow hover:bg-gray-100" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toggle */}
        <button onClick={() => setShowFilters((v) => !v)} className="absolute bottom-4 right-4 p-2 bg-white rounded shadow hover:bg-gray-100 z-10" title="Toggle Filters">
          <Filter className="w-4 h-4" />
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow p-3 z-10">
            <label className="block text-sm text-gray-600 mb-2">Filter by status</label>
            <select className="border-gray-300 rounded-md text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {houseStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="mt-3">
              <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} />
                Show legend
              </label>
            </div>
          </div>
        )}

        {/* Legend */}
        {showLegend && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow p-3 flex gap-4 items-center z-10">
            <LegendItem color="#10B981" label="Visited" />
            <LegendItem color="#F59E0B" label="Not Home" />
            <LegendItem color="#EF4444" label="Do Not Call" />
            <LegendItem color="#8B5CF6" label="Interested" />
            <LegendItem color="#4285F4" label="Other" />
          </div>
        )}
      </div>
    </div>
  );
}
