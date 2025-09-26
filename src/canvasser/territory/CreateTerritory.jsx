import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  GoogleMap,
  DrawingManager,
  Circle,
} from "@react-google-maps/api";
import {
  Search, Triangle, X, Save, Loader2, Eye,
  ChevronDown, ChevronUp, Compass, ZoomIn, ZoomOut
} from "lucide-react";
import { useCreateItineraryItemMutation } from "../../features/territory/TerritoryApiSlice";
import { useGetLeadUsersQuery } from "../../features/leads/leadsApiSlice";
import toast, { Toaster } from "react-hot-toast";

const HOUSTON_CENTER = { lat: 29.7604, lng: -95.3698 };
const DEFAULT_MAP_CENTER = HOUSTON_CENTER;
const DEFAULT_ZOOM = 6;
const DEFAULT_COLOR = "#3B82F6";
const SOUTH_CENTRAL_BOUNDS = {
  north: 30.5,
  south: 29.0,
  west: -96.5,
  east: -94.5,
};

const BASE_MAP_OPTIONS = {
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  zoomControl: false,
  gestureHandling: "greedy",
  disableDoubleClickZoom: false,
  clickableIcons: true,
  isFractionalZoomEnabled: true,
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
};

const toGeoJSONPolygon = (pts = []) => {
  const normalized = (pts ?? []).map((c) => [Number(c.lng), Number(c.lat)]);
  if (normalized.length) {
    const first = normalized[0];
    const last = normalized[normalized.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) normalized.push(first);
  }
  return { type: "Polygon", coordinates: [normalized] };
};

const getLocationName = (addressComponents = []) => {
  const neighborhood = addressComponents.find((c) => c.types.includes("neighborhood"));
  const locality = addressComponents.find((c) => c.types.includes("locality"));
  const admin2 = addressComponents.find((c) => c.types.includes("administrative_area_level_2"));
  const admin1 = addressComponents.find((c) => c.types.includes("administrative_area_level_1"));
  const country = addressComponents.find((c) => c.types.includes("country"));
  return (
    neighborhood?.long_name ||
    locality?.long_name ||
    admin2?.long_name ||
    admin1?.long_name ||
    country?.long_name
  );
};

const TerritoryMapCreate = () => {
  const mapRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const radiusCircleRef = useRef(null);
  const gListenersRef = useRef([]);

  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState("hybrid");
  const [proDetail, setProDetail] = useState(true);
  const [drawingMode, setDrawingMode] = useState(false);
  const [coords, setCoords] = useState(null);
  const [centerLL, setCenterLL] = useState(null);
  const [suggestedName, setSuggestedName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [savingUIOpen, setSavingUIOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [type, setType] = useState("polygon");
  const [radiusVal, setRadiusVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [createItem, { isLoading: isSaving }] = useCreateItineraryItemMutation();
  const [usersPage] = useState(1);
  const {
    data: usersData = {},
    isLoading: isLoadingUsers,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useGetLeadUsersQuery(usersPage);

  const users = usersData?.data?.data || [];
  const [assignedUserId, setAssignedUserId] = useState("");

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMap(map);
    autocompleteService.current = new window.google.maps.places.AutocompleteService();
    placesService.current = new window.google.maps.places.PlacesService(map);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
    gListenersRef.current.forEach((l) => window.google?.maps?.event?.removeListener(l));
    gListenersRef.current = [];
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }
  }, []);

  const handlePolygonComplete = useCallback((event) => {
    const path = event.overlay.getPath();
    const points = [];
    for (let i = 0; i < path.getLength(); i++) {
      const latLng = path.getAt(i);
      points.push({ lat: latLng.lat(), lng: latLng.lng() });
    }
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
    const center = bounds.getCenter();

    setDetecting(true);
    new window.google.maps.Geocoder().geocode({ location: center }, (results, status) => {
      setDetecting(false);
      if (status === "OK" && results?.[0]) {
        const name = getLocationName(results[0].address_components) || results[0].formatted_address.split(",")[0];
        setSuggestedName(name);
      } else setSuggestedName("");
      setCoords(points);
      setCenterLL({ lat: center.lat(), lng: center.lng() });
      setSavingUIOpen(true);
      setDrawingMode(false);
      event.overlay.setMap(null);
    });
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || !autocompleteService.current) return;

    const bounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(SOUTH_CENTRAL_BOUNDS.south, SOUTH_CENTRAL_BOUNDS.west),
      new window.google.maps.LatLng(SOUTH_CENTRAL_BOUNDS.north, SOUTH_CENTRAL_BOUNDS.east)
    );
    autocompleteService.current.getPlacePredictions(
      {
        input: searchQuery,
        componentRestrictions: { country: "us" },
        bounds,
        types: ["geocode"],
      },
      (predictions, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          setSearchResults([]);
          setShowSearchResults(false);
          return;
        }
        setSearchResults(predictions);
        setShowSearchResults(true);
      }
    );
  }, [searchQuery]);

  const handleSelectResult = useCallback((placeId) => {
    if (!placesService.current) return;
    placesService.current.getDetails({ placeId }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
        const loc = place.geometry.location;
        const bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(SOUTH_CENTRAL_BOUNDS.south, SOUTH_CENTRAL_BOUNDS.west),
          new window.google.maps.LatLng(SOUTH_CENTRAL_BOUNDS.north, SOUTH_CENTRAL_BOUNDS.east)
        );
        const inBounds = bounds.contains(loc);
        const target = inBounds ? loc : new window.google.maps.LatLng(HOUSTON_CENTER.lat, HOUSTON_CENTER.lng);
        mapRef.current?.panTo(target);
        mapRef.current?.setZoom(12);
        setShowSearchResults(false);
        setSearchQuery(place.formatted_address || "");
      }
    });
  }, []);

  const startDrawing = useCallback(() => {
    setCoords(null);
    setCenterLL(null);
    setSavingUIOpen(false);
    setDrawingMode(true);
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }
  }, []);

  const cancelDrawing = useCallback(() => {
    setDrawingMode(false);
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }
  }, []);

  const handleSelectCenterForRadius = useCallback(() => {
    setDrawingMode(true);
    toast("Click on the map to set the center point", { icon: "📍" });

    const clickListener = mapRef.current.addListener("click", (e) => {
      const p = e.latLng;
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(SOUTH_CENTRAL_BOUNDS.south, SOUTH_CENTRAL_BOUNDS.west),
        new window.google.maps.LatLng(SOUTH_CENTRAL_BOUNDS.north, SOUTH_CENTRAL_BOUNDS.east)
      );
      const inBounds = bounds.contains(p);
      if (!inBounds) {
        toast.error("Please select a point within the allowed region.");
        return;
      }

      const center = { lat: p.lat(), lng: p.lng() };
      setCenterLL(center);
      setSavingUIOpen(true);

      const meters = Number(radiusVal || 0) * 1000;
      if (radiusCircleRef.current) radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = new window.google.maps.Circle({
        center,
        radius: meters,
        fillOpacity: 0.25,
        strokeWeight: 2,
        strokeColor: color,
        fillColor: color,
        map: mapRef.current,
      });

      setDetecting(true);
      new window.google.maps.Geocoder().geocode({ location: p }, (results, status) => {
        setDetecting(false);
        if (status === "OK" && results?.[0]) {
          const name = getLocationName(results[0].address_components) || results[0].formatted_address.split(",")[0];
          setSuggestedName(name);
        } else setSuggestedName("");
      });

      window.google.maps.event.removeListener(clickListener);
      setDrawingMode(false);
    });
    gListenersRef.current.push(clickListener);
  }, [color, radiusVal]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (type === "polygon" && (!coords || coords.length < 3)) {
      toast.error("Please draw a valid polygon with at least 3 points.");
      return;
    }
    if (type === "radius" && (!centerLL || !radiusVal || isNaN(radiusVal) || Number(radiusVal) <= 0)) {
      toast.error("Please set a valid center point and radius.");
      return;
    }

    const name = e.target.elements.name.value.trim() || suggestedName || "Territory";
    const body = {
      name,
      type,
      color,
      assigned_to: assignedUserId || null,
      polygon: null,
      radius: null,
      center_lat: null,
      center_lng: null,
    };

    if (type === "polygon") {
      body.polygon = toGeoJSONPolygon(coords);
    } else {
      body.radius = Number(radiusVal);
      body.center_lat = centerLL.lat;
      body.center_lng = centerLL.lng;
    }

    try {
      const res = await createItem({ type, payload: body }).unwrap();
      toast.success(res?.message || "Territory created successfully.");
      setSavingUIOpen(false);
      setCoords(null);
      setCenterLL(null);
      setSuggestedName("");
      setRadiusVal("");
      setAssignedUserId("");
      radiusCircleRef.current?.setMap(null);
      radiusCircleRef.current = null;
    } catch (err) {
      console.error("Failed to create territory:", err);
      toast.error(err?.data?.message || "Failed to create territory.");
    }
  };

  const zoomIn = () => mapRef.current?.setZoom(mapRef.current.getZoom() + 1);
  const zoomOut = () => mapRef.current?.setZoom(mapRef.current.getZoom() - 1);
  const resetView = () => {
    if (!mapRef.current) return;
    mapRef.current.panTo(HOUSTON_CENTER);
    mapRef.current.setZoom(DEFAULT_ZOOM);
  };

  return (
    <div className="relative h-[calc(100vh-100px)] min-h-[720px] w-full bg-[#0a1122]">
      <Toaster position="top-right" />
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          ...BASE_MAP_OPTIONS,
          mapTypeId: mapType,
          restriction: {
            latLngBounds: SOUTH_CENTRAL_BOUNDS,
            strictBounds: true,
          },
        }}
      >
        {drawingMode && (
          <DrawingManager
            onPolygonComplete={handlePolygonComplete}
            options={{
              drawingMode: type === "polygon" ? window.google.maps.drawing.OverlayType.POLYGON : null,
              drawingControl: false,
              polygonOptions: {
                fillColor: color,
                fillOpacity: 0.25,
                strokeWeight: 2,
                strokeColor: color,
                clickable: false,
                editable: true,
                zIndex: 1,
              },
            }}
          />
        )}
        {type === "radius" && radiusCircleRef.current && (
          <Circle
            center={centerLL}
            radius={Number(radiusVal || 0) * 1000}
            options={{
              fillColor: color,
              fillOpacity: 0.25,
              strokeWeight: 2,
              strokeColor: color,
            }}
          />
        )}
      </GoogleMap>

      {/* Top: Search + Controls toggle */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="flex items-center rounded-xl bg-white/95 backdrop-blur-md shadow-lg px-3 py-2">
            <Search size={18} className="text-slate-500 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search location..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-500 focus:outline-none"
              aria-label="Search location"
            />
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-12 max-h-64 overflow-y-auto rounded-xl bg-white shadow-2xl border border-slate-200" role="listbox">
              {searchResults.map((r) => (
                <button
                  key={r.place_id}
                  onClick={() => handleSelectResult(r.place_id)}
                  className="w-full p-3 text-left text-slate-800 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0"
                  role="option"
                >
                  <div className="text-sm font-medium">{r.structured_formatting?.main_text}</div>
                  <div className="text-xs text-slate-500">{r.structured_formatting?.secondary_text}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowControls((v) => !v)}
          className="p-2 ml-4 rounded-lg bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white transition-colors shadow-lg"
          title={showControls ? "Hide Controls" : "Show Controls"}
        >
          {showControls ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Left controls panel */}
      {showControls && (
        <div className="absolute top-20 left-4 z-20 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-lg">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Map Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "roadmap", label: "Road", icon: "🗺️" },
                  { id: "hybrid", label: "Hybrid", icon: "🌎" },
                  { id: "satellite", label: "Satellite", icon: "🛰️" },
                  { id: "terrain", label: "Terrain", icon: "⛰️" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMapType(t.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium ${
                      mapType === t.id ? "bg-indigo-100 text-indigo-700 border border-indigo-300" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                    title={`Switch to ${t.label}`}
                  >
                    <span className="text-base mb-1">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Territory Type</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setType("polygon")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${type === "polygon" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  Polygon
                </button>
                <button
                  onClick={() => setType("radius")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${type === "radius" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  Radius
                </button>
              </div>
              {type === "radius" && (
                <div className="mb-3">
                  <label className="block text-xs text-slate-600 mb-1">Radius (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="10.3"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={radiusVal}
                    onChange={(e) => {
                      setRadiusVal(e.target.value);
                      if (radiusCircleRef.current) radiusCircleRef.current.setRadius(Number(e.target.value || 0) * 1000);
                    }}
                    aria-label="Enter radius in kilometers"
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="block text-xs text-slate-600 mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
                    title={color}
                    aria-label="Select territory color"
                  />
                  <span className="text-sm text-slate-700">{color}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {!drawingMode ? (
                  <button
                    onClick={() => (type === "polygon" ? startDrawing() : handleSelectCenterForRadius())}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                  >
                    <Triangle size={16} /> {type === "polygon" ? "Draw" : "Select Center"}
                  </button>
                ) : (
                  <button
                    onClick={cancelDrawing}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
                  >
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>
              <div className="border-t border-slate-200 pt-3">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">View Options</h3>
                <button
                  onClick={() => setProDetail((v) => !v)}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium ${
                    proDetail ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
                  }`}
                  title="Toggle Pro/HD detail (tilt)"
                >
                  <Eye size={16} /> {proDetail ? "HD Mode: On" : "HD Mode: Off"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map nav controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button onClick={zoomIn} className="p-2 rounded-lg bg-white/90 text-slate-700 hover:bg-white shadow-lg" title="Zoom in">
          <ZoomIn size={20} />
        </button>
        <button onClick={zoomOut} className="p-2 rounded-lg bg-white/90 text-slate-700 hover:bg-white shadow-lg" title="Zoom out">
          <ZoomOut size={20} />
        </button>
        <button onClick={resetView} className="p-2 rounded-lg bg-white/90 text-slate-700 hover:bg-white shadow-lg" title="Reset view">
          <Compass size={20} />
        </button>
      </div>

      {/* Save Panel */}
      {savingUIOpen && (coords || centerLL) && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-80 rounded-xl bg-white/95 p-5 shadow-xl border border-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Save Territory</h3>
            <button
              onClick={() => {
                setSavingUIOpen(false);
                setCoords(null);
                setCenterLL(null);
                setSuggestedName("");
                setAssignedUserId("");
                if (radiusCircleRef.current) {
                  radiusCircleRef.current.setMap(null);
                  radiusCircleRef.current = null;
                }
              }}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          {detecting ? (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
              <Loader2 className="animate-spin" /> Detecting location name…
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Territory Name *</label>
                <input
                  name="name"
                  defaultValue={suggestedName || ""}
                  placeholder="e.g., Downtown Dallas"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign to User</label>
                {isLoadingUsers ? (
                  <div className="text-xs text-slate-500">Loading users…</div>
                ) : isUsersError ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-rose-600">Failed to load users</span>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded border border-slate-300"
                      onClick={() => refetchUsers()}
                    >
                      Retry
                    </button>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-xs text-slate-500">No users found</div>
                ) : (
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select User --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email || `User #${u.id}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {type === "polygon" && coords && (
                <div className="text-xs text-slate-500">{coords.length} points selected</div>
              )}
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                <div className="flex justify-between"><span>Type:</span><span className="font-medium text-slate-800">{type}</span></div>
                {type === "radius" && (
                  <div className="flex justify-between"><span>Radius:</span><span className="font-medium text-slate-800">{radiusVal || 0} km</span></div>
                )}
                <div className="flex justify-between">
                  <span>Color:</span>
                  <span className="font-medium inline-block w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: color }} />
                </div>
                <div className="flex justify-between">
                  <span>Center:</span>
                  <span className="font-medium text-slate-800">
                    {centerLL ? `${centerLL.lat.toFixed(4)}, ${centerLL.lng.toFixed(4)}` : "—"}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:bg-slate-400"
              >
                <Save size={16} /> {isSaving ? "Saving..." : "Save Territory"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default TerritoryMapCreate;