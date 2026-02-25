import React, { useEffect, useRef, useState } from "react";
import {
  X, Save, Edit3, RotateCcw, MapPin, Navigation,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Loader2,
  Square, Circle, Layers, Moon, Sun
} from "lucide-react";
import { useGetItineraryByIdQuery, useUpdateItineraryItemMutation } from "../../features/territory/TerritoryApiSlice";
import toast from "react-hot-toast";


const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };


export default function TerritoryMapUpdate({ id, open, onClose }) {
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const territoryShapeRef = useRef(null);
  const editListenersRef = useRef([]);

  // === Dark Mode State ===
  const [darkMode, setDarkMode] = useState(() => {
    // Check for saved preference or system preference
    const saved = localStorage.getItem("territoryDarkMode");
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem("territoryDarkMode", JSON.stringify(darkMode));

    // Update document class for potential global styling
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // === API: FETCH & UPDATE ===
  const {
    data: apiRes,
    isLoading: isDataLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetItineraryByIdQuery(id, {
    // Only fetch when a valid id is provided and modal is open
    skip: !id || !open,
    refetchOnMountOrArgChange: true,
  });
  const [updateItem, { isLoading: isSaving }] = useUpdateItineraryItemMutation();

  // === Local UI state ===
  const [color, setColor] = useState("#3B82F6");
  const [name, setName] = useState("");
  const [type, setType] = useState("polygon");
  const [coords, setCoords] = useState([]); // [{lat,lng}]
  const [radius, setRadius] = useState(1); // km
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // === Load Google Maps script once when modal opens ===
  useEffect(() => {
    if (!open) return;

    const ready = () => !!(window.google && window.google.maps);
    if (ready()) {
      setScriptLoaded(true);
      return;
    }

    const existing = document.getElementById("gmaps-script");
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
      toast.success("Google Maps loaded");
    };
    script.onerror = () => {
      console.error("Google Maps script failed to load");
      toast.error("Failed to load Google Maps");
    };
    document.head.appendChild(script);
  }, [open]);

  // === Initialize map once script is ready ===
  useEffect(() => {
    if (!scriptLoaded || !open || !mapRef.current) return;

    const mapStyles = darkMode ? [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }]
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }]
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }]
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }]
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }]
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }]
      },
      {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }]
      },
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    ] : [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    ];

    const map = new window.google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: false,
      zoomControl: false, // we add our own controls
      styles: mapStyles,
    });

    mapObjRef.current = map;

    // Custom zoom control (no JSX in innerHTML)
    const zoomControlDiv = document.createElement("div");
    makeZoomControl(zoomControlDiv, map, darkMode);
    zoomControlDiv.index = 1;
    map.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(zoomControlDiv);

    // Drawing manager (to get editable shapes)
    drawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: color,
        strokeColor: color,
        fillOpacity: 0.3,
        strokeWeight: 3,
        editable: true,
        draggable: true,
      },
      circleOptions: {
        fillColor: color,
        strokeColor: color,
        fillOpacity: 0.3,
        strokeWeight: 3,
        editable: true,
        draggable: true,
      },
    });
    drawingManagerRef.current.setMap(map);

    window.google.maps.event.addListenerOnce(map, "idle", () => setMapLoaded(true));

    return () => {
      clearEditListeners();
      if (territoryShapeRef.current) territoryShapeRef.current.setMap(null);
      if (drawingManagerRef.current) drawingManagerRef.current.setMap(null);
      mapObjRef.current = null;
    };
  }, [scriptLoaded, open, darkMode]);

  // === Draw territory whenever API data & map are both ready ===
  useEffect(() => {
    if (!mapLoaded || !mapObjRef.current) return;

    if (isError) {
      toast.error("Failed to fetch territory");
      return;
    }

    const territory = apiRes?.data; // <-- your API returns { data: {...} }
    if (!territory) {
      // No territory yet — just center to default
      mapObjRef.current.setCenter(DEFAULT_CENTER);
      mapObjRef.current.setZoom(12);
      return;
    }

    loadTerritoryData(mapObjRef.current, territory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRes, isError, mapLoaded]);

  // === Helpers ===
  const clearEditListeners = () => {
    if (!editListenersRef.current.length) return;
    editListenersRef.current.forEach((l) => window.google.maps.event.removeListener(l));
    editListenersRef.current = [];
  };

  const loadTerritoryData = (map, territoryData) => {
    // Clear existing shape & listeners
    clearEditListeners();
    if (territoryShapeRef.current) {
      territoryShapeRef.current.setMap(null);
      territoryShapeRef.current = null;
    }

    setName(territoryData.name || "");
    const nextColor = territoryData.color || "#3B82F6";
    setColor(nextColor);
    const nextType = territoryData.type || "polygon";
    setType(nextType);

    if (nextType === "polygon" && territoryData.polygon?.coordinates) {
      const coordsArr = territoryData.polygon.coordinates[0]
        .map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }));

      setCoords(coordsArr);

      territoryShapeRef.current = new window.google.maps.Polygon({
        paths: coordsArr,
        editable: false,
        draggable: false,
        strokeColor: nextColor,
        strokeWeight: 3,
        fillColor: nextColor,
        fillOpacity: 0.3,
        map,
        zIndex: 1000,
      });

      const bounds = new window.google.maps.LatLngBounds();
      coordsArr.forEach((c) => bounds.extend(c));
      if (!bounds.isEmpty()) map.fitBounds(bounds);
    } else if (
      nextType === "radius" &&
      territoryData.center_lat != null &&
      territoryData.center_lng != null
    ) {
      const centerCoords = { lat: Number(territoryData.center_lat), lng: Number(territoryData.center_lng) };
      setCenter(centerCoords);
      const r = Number(territoryData.radius || 1);
      setRadius(r);

      territoryShapeRef.current = new window.google.maps.Circle({
        center: centerCoords,
        radius: r * 1000,
        editable: false,
        draggable: false,
        strokeColor: nextColor,
        strokeWeight: 3,
        fillColor: nextColor,
        fillOpacity: 0.3,
        map,
        zIndex: 1000,
      });

      const bounds = territoryShapeRef.current.getBounds();
      if (bounds) map.fitBounds(bounds);
    } else {
      // Fallback to default
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(12);
    }
  };

  function makeZoomControl(controlDiv, map, isDark) {
    controlDiv.style.padding = "6px";

    const mkBtn = (label, title) => {
      const b = document.createElement("button");
      b.type = "button";
      b.title = title;
      b.textContent = label;
      b.className = `p-2 rounded shadow-md hover:bg-opacity-80 w-9 h-9 flex items-center justify-center text-lg ${
        isDark
          ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
          : "bg-white text-gray-800 hover:bg-gray-100"
      }`;
      return b;
    };

    const zoomInBtn = mkBtn("+", "Zoom in");
    const zoomOutBtn = mkBtn("-", "Zoom out");

    controlDiv.appendChild(zoomInBtn);
    controlDiv.appendChild(zoomOutBtn);

    window.google.maps.event.addDomListener(zoomInBtn, "click", () => map.setZoom(map.getZoom() + 1));
    window.google.maps.event.addDomListener(zoomOutBtn, "click", () => map.setZoom(map.getZoom() - 1));
  }

  // === Edit / Reset / Save ===
  const toggleEdit = () => {
    if (!territoryShapeRef.current) return;

    const newEditing = !isEditing;
    setIsEditing(newEditing);

    if (
      territoryShapeRef.current instanceof window.google.maps.Polygon ||
      territoryShapeRef.current instanceof window.google.maps.Circle
    ) {
      territoryShapeRef.current.setEditable(newEditing);
      territoryShapeRef.current.setDraggable(newEditing);
    }

    clearEditListeners();

    if (newEditing) {
      if (type === "polygon") {
        const path = territoryShapeRef.current.getPath();
        const pushCoords = () => setCoords(path.getArray().map((p) => ({ lat: p.lat(), lng: p.lng() })));
        editListenersRef.current.push(
          window.google.maps.event.addListener(path, "set_at", pushCoords),
          window.google.maps.event.addListener(path, "insert_at", pushCoords),
          window.google.maps.event.addListener(path, "remove_at", pushCoords)
        );
      } else {
        editListenersRef.current.push(
          window.google.maps.event.addListener(
            territoryShapeRef.current,
            "radius_changed",
            () => setRadius(territoryShapeRef.current.getRadius() / 1000)
          ),
          window.google.maps.event.addListener(
            territoryShapeRef.current,
            "center_changed",
            () => {
              const c = territoryShapeRef.current.getCenter();
              setCenter({ lat: c.lat(), lng: c.lng() });
            }
          )
        );
      }
    }
  };

  const resetChanges = () => {
    const territory = apiRes?.data;
    if (territory && mapObjRef.current) {
      if (territoryShapeRef.current) territoryShapeRef.current.setMap(null);
      loadTerritoryData(mapObjRef.current, territory);
    }
    setIsEditing(false);
  };

  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a territory name");
      return;
    }

    try {
      let payload;
      if (type === "polygon") {
        if (coords.length < 3) {
          toast.error("A polygon needs at least 3 points");
          return;
        }
        payload = {
          name: name.trim(),
          type: "polygon",
          color,
          polygon: {
            type: "Polygon",
            coordinates: [[
              ...coords.map((p) => [p.lng, p.lat]),
              [coords[0].lng, coords[0].lat],
            ]],
          },
        };
      } else {
        if (!center || radius <= 0) {
          toast.error("Please set a valid center and radius");
          return;
        }
        payload = {
          name: name.trim(),
          type: "radius",
          radius,
          color,
          center_lat: center.lat,
          center_lng: center.lng,
        };
      }

      // === API UPDATE CALL (by id) ===
      await updateItem({ id, payload }).unwrap();
      toast.success("Territory updated successfully!");
      setIsEditing(false);
      refetch(); // get latest from server
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err?.data?.message || "Failed to update territory");
    }
  };

  // === Extra map helpers ===
  const zoomIn = () => {
    const m = mapObjRef.current;
    if (!m) return;
    m.setZoom(m.getZoom() + 1);
  };
  const zoomOut = () => {
    const m = mapObjRef.current;
    if (!m) return;
    m.setZoom(m.getZoom() - 1);
  };
  const centerMap = () => {
    const m = mapObjRef.current;
    if (!m) return;
    if (type === "polygon" && coords.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      coords.forEach((c) => bounds.extend(c));
      if (!bounds.isEmpty()) m.fitBounds(bounds);
    } else if (type === "radius" && center) {
      m.setCenter(center);
      m.setZoom(14);
    } else {
      m.setCenter(DEFAULT_CENTER);
      m.setZoom(12);
    }
  };

  const changeTerritoryType = (newType) => {
    if (isEditing) {
      toast.error("Finish editing before changing territory type");
      return;
    }
    setType(newType);
    toast.success(`Territory type changed to ${newType}`);

    const territory = apiRes?.data;
    if (territory && mapObjRef.current) {
      const next = { ...territory, type: newType };
      loadTerritoryData(mapObjRef.current, next);
    }
  };

  if (!open) return null;

  const hasApiTerritory = Boolean(apiRes?.data);

  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 ${darkMode ? "bg-gray-900" : "bg-black/90"}`}>
      <div
        className={`rounded-xl shadow-2xl relative flex flex-col z-[999] transition-all duration-300 overflow-hidden ${
          isFullscreen ? "w-full h-full" : "w-full max-w-6xl h-[90vh]"
        } ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-4 border-b rounded-t-xl ${
          darkMode
            ? "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700"
            : "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 text-white"
        }`}>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin size={20} />
            {hasApiTerritory ? "Edit Territory" : "Create Territory"}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
              darkMode ? "bg-gray-700 text-gray-300" : "bg-white/20 text-white"
            }`}>ID: {id}</span>
          </h2>

          <div className="flex items-center gap-2">
            {(isFetching || isDataLoading) && (
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                darkMode ? "bg-gray-700 text-gray-300" : "bg-white/20 text-white"
              }`}>
                <Loader2 size={12} className="animate-spin" /> fetching
              </span>
            )}

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded transition-colors ${
                darkMode
                  ? "text-yellow-300 hover:bg-gray-700"
                  : "text-blue-100 hover:bg-blue-500"
              }`}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded transition-colors ${
                darkMode
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-white hover:bg-blue-500"
              }`}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded transition-colors ${
                darkMode
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-white hover:bg-blue-500"
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Error state */}
        {isError && (
          <div className={`p-6 ${darkMode ? "text-red-400" : "text-red-600"}`}>
            {(error && (error.data?.message || error.error)) || "Failed to load territory."}
          </div>
        )}

        {/* Loading state */}
        {isDataLoading && !isError ? (
          <div className={`flex items-center justify-center p-12 flex-col ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Loading territory data...</span>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-r p-4 flex flex-col gap-4 overflow-y-auto ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
            }`}>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Territory Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`border px-3 py-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Enter territory name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Territory Type
                </label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => changeTerritoryType("polygon")}
                    className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-1 text-sm ${
                      type === "polygon"
                        ? darkMode
                          ? "bg-blue-800 text-blue-100 border border-blue-700"
                          : "bg-blue-100 text-blue-700 border border-blue-300"
                        : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Square size={14} />
                    Polygon
                  </button>
                  <button
                    type="button"
                    onClick={() => changeTerritoryType("radius")}
                    className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-1 text-sm ${
                      type === "radius"
                        ? darkMode
                          ? "bg-blue-800 text-blue-100 border border-blue-700"
                          : "bg-blue-100 text-blue-700 border border-blue-300"
                        : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Circle size={14} />
                    Radius
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const val = e.target.value;
                      setColor(val);
                      if (territoryShapeRef.current) {
                        territoryShapeRef.current.setOptions({ fillColor: val, strokeColor: val });
                      }
                    }}
                    className="h-10 w-10 rounded cursor-pointer border border-gray-300"
                  />
                  <div className={`flex-1 flex items-center gap-2 border rounded-md px-3 py-2 ${
                    darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                  }`}>
                    <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: color }}></div>
                    <span className="text-sm font-mono">{color}</span>
                  </div>
                </div>
              </div>

              <div className={`border-t pt-4 mt-2 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`font-medium mb-2 flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-800"}`}>
                  <Layers size={16} />
                  Territory Details
                </h3>

                {type === "radius" && center && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Radius (km)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={radius}
                        onChange={(e) => {
                          const newRadius = parseFloat(e.target.value || "0");
                          setRadius(newRadius);
                          if (territoryShapeRef.current) territoryShapeRef.current.setRadius(newRadius * 1000);
                        }}
                        className={`border px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>

                    <div className={`text-sm p-2 rounded-md ${
                      darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-50 text-blue-900"
                    }`}>
                      <p className="font-medium">Center Coordinates</p>
                      <p>Lat: {center.lat?.toFixed?.(6)}</p>
                      <p>Lng: {center.lng?.toFixed?.(6)}</p>
                    </div>
                  </div>
                )}

                {type === "polygon" && coords.length > 0 && (
                  <div className={`text-sm p-2 rounded-md ${
                    darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-50 text-blue-900"
                  }`}>
                    <p className="font-medium">Polygon Details</p>
                    <p>{coords.length} points</p>
                    <p className="mt-1 text-xs opacity-75">
                      Click Edit to modify the shape directly on the map
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleEdit}
                    disabled={!hasApiTerritory || !territoryShapeRef.current}
                    className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-1 ${
                      isEditing
                        ? darkMode
                          ? "bg-yellow-700 text-white hover:bg-yellow-600"
                          : "bg-yellow-500 text-white hover:bg-yellow-600"
                        : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    } ${!hasApiTerritory ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Edit3 size={16} />
                    {isEditing ? "Editing..." : "Edit Shape"}
                  </button>

                  <button
                    type="button"
                    onClick={resetChanges}
                    disabled={!isEditing}
                    className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-1 ${
                      !isEditing
                        ? "opacity-50 cursor-not-allowed"
                        : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !hasApiTerritory}
                  className={`w-full py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                    darkMode
                      ? "bg-blue-700 text-white hover:bg-blue-600"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
              <div ref={mapRef} className="h-full w-full min-h-[500px]" />

              <div className={`absolute right-4 bottom-4 flex flex-col gap-2 rounded-lg shadow-md p-2 border ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <button
                  onClick={zoomIn}
                  className={`p-2 rounded-md transition-colors ${
                    darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-800 hover:bg-gray-100"
                  }`}
                  title="Zoom in"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={zoomOut}
                  className={`p-2 rounded-md transition-colors ${
                    darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-800 hover:bg-gray-100"
                  }`}
                  title="Zoom out"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  onClick={centerMap}
                  className={`p-2 rounded-md transition-colors ${
                    darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-800 hover:bg-gray-100"
                  }`}
                  title="Recenter map"
                >
                  <Navigation size={18} />
                </button>
              </div>

              {!scriptLoaded && (
                <div className={`absolute inset-0 flex items-center justify-center flex-col ${
                  darkMode ? "bg-gray-800/80 text-gray-300" : "bg-white/80 text-gray-700"
                }`}>
                  <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                  <span>Loading maps...</span>
                </div>
              )}

              {isEditing && (
                <div className={`absolute top-4 left-4 p-3 rounded-lg shadow-md max-w-xs ${
                  darkMode ? "bg-gray-800 text-gray-200 border border-gray-700" : "bg-blue-600 text-white"
                }`}>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Edit3 size={16} />
                    {type === "polygon" ? "Editing Polygon" : "Editing Circle"}
                  </h4>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-blue-100"}`}>
                    {type === "polygon"
                      ? "Drag the points to reshape the territory. Click on a line to add new points."
                      : "Drag the center to move or drag the edge to resize the circle."}
                  </p>
                  <button
                    onClick={toggleEdit}
                    className={`mt-2 text-xs px-2 py-1 rounded ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                        : "bg-blue-700 hover:bg-blue-800 text-white"
                    }`}
                  >
                    Done Editing
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
