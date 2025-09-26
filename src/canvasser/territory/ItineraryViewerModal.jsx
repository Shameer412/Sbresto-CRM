import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  Polygon,
  Circle,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import {
  X, MapPin, Maximize2, Minimize2,
  ZoomIn, ZoomOut, Navigation, Satellite, Navigation2
} from "lucide-react";
import {
  useGetItineraryByIdQuery,
  useUpdateItineraryHouseInfoMutation,
  useCreateItineraryHouseInfoMutation,
} from "../../features/territory/TerritoryApiSlice";
import FormModel from "./FormModel";

const FALLBACK_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const toLatLng = ([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) });
const extractPolygonPath = (polygon) => (polygon?.coordinates?.[0] || []).map(toLatLng);
const normalize = (s) => (s || "").toString().trim().toLowerCase();
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const showNull = (v) => (v ?? "null");
const showPhone = (v) => (v ?? "00000");
const showNotes = (v) => (v ?? "Visite");

export default function ItineraryViewerModalGoogleV2({
  open,
  onClose,
  id,
  apiKey = FALLBACK_API_KEY,
  onAddLead,
}) {
  const { data, isLoading } = useGetItineraryByIdQuery(id, { skip: !id });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState("satellite");
  const mapRef = useRef(null);
  const fittedRef = useRef(false);
  const initialCenterRef = useRef(null);

  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [editHouseId, setEditHouseId] = useState(null);
  const [editFields, setEditFields] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [updateHouseInfo, { isLoading: isSaving, error: saveError }] = useUpdateItineraryHouseInfoMutation();
  const [createHouse, { isLoading: isCreating, error: createError }] = useCreateItineraryHouseInfoMutation();

  const [newHouseModalOpen, setNewHouseModalOpen] = useState(false);
  const [newHouseFields, setNewHouseFields] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    itinerary_id: null,
    state: "",
    city: "",
    address: "",
    home_value: "",
    homeowner_confirmed: "",
    length_of_residence: "",
  });

  const [locationPermissionModal, setLocationPermissionModal] = useState(false);
  const [locationPermissionAction, setLocationPermissionAction] = useState(null);
  const [locationPermissionHouseId, setLocationPermissionHouseId] = useState(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const [itinerary, setItinerary] = useState(null);
  useEffect(() => {
    if (data?.data) {
      setItinerary(data.data);
      fittedRef.current = false;
    }
  }, [data]);

  const item = itinerary;
  const isRadius = normalize(item?.type) === "radius";
  const polygonPath = extractPolygonPath(item?.polygon);

  const houses = useMemo(() => {
    const list = Array.isArray(item?.houses) ? item.houses : [];
    return list
      .map((h) => {
        const lat = toNumber(h.latitude);
        const lng = toNumber(h.longitude);
        if (lat == null || lng == null) return null;
        return { ...h, position: { lat, lng } };
      })
      .filter(Boolean);
  }, [item?.houses]);

  const computedCenter = useMemo(() => {
    if (item?.center_lat && item?.center_lng) {
      return { lat: Number(item.center_lat), lng: Number(item.center_lng) };
    }
    if (polygonPath.length > 0) {
      const latSum = polygonPath.reduce((sum, p) => sum + p.lat, 0);
      const lngSum = polygonPath.reduce((sum, p) => sum + p.lng, 0);
      return { lat: latSum / polygonPath.length, lng: lngSum / polygonPath.length };
    }
    if (houses.length > 0) {
      const latSum = houses.reduce((s, h) => s + h.position.lat, 0);
      const lngSum = houses.reduce((s, h) => s + h.position.lng, 0);
      return { lat: latSum / houses.length, lng: lngSum / houses.length };
    }
    return { lat: 31.5204, lng: 74.3587 };
  }, [item, polygonPath, houses]);

  if (!initialCenterRef.current) initialCenterRef.current = computedCenter;

  const radiusMeters = Number(item?.radius) * 1000 || undefined;

  const fitEverything = useCallback(
    (m) => {
      const g = window.google;
      if (!g || !m) return;

      const bounds = new g.maps.LatLngBounds();
      polygonPath.forEach((c) => bounds.extend(c));
      if (isRadius && initialCenterRef.current && radiusMeters) {
        const circle = new g.maps.Circle({
          center: initialCenterRef.current,
          radius: radiusMeters,
        });
        const circleBounds = circle.getBounds();
        if (circleBounds) bounds.union(circleBounds);
      }
      houses.forEach((h) => bounds.extend(h.position));
      if (!bounds.isEmpty()) {
        m.fitBounds(bounds, 80);
        const listener = g.maps.event.addListener(m, "bounds_changed", function () {
          const zoom = m.getZoom();
          if (zoom > 20) m.setZoom(20);
          g.maps.event.removeListener(listener);
        });
      }
    },
    [polygonPath, isRadius, radiusMeters, houses]
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
      }, 500);
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
  const toggleMapType = useCallback(() => {
    setMapType((prev) => (prev === "satellite" ? "hybrid" : "satellite"));
  }, []);

  const handleClose = useCallback(() => {
    setIsFullscreen(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && handleClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (map && data && !fittedRef.current) {
      setTimeout(() => {
        fitEverything(map);
        fittedRef.current = true;
      }, 300);
    }
  }, [data, map, fitEverything]);

  const [hoveredHouseId, setHoveredHouseId] = useState(null);
  const hoverTimerRef = useRef(null);

  const openInfo = useCallback((id) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredHouseId(id);
  }, []);

  const closeInfoWithDelay = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredHouseId(null), 200);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const handleAddLead = useCallback(
    (house) => {
      if (onAddLead) onAddLead(house);
      else console.log("Add Lead clicked for house:", house);
    },
    [onAddLead]
  );

  const requestLocationPermission = useCallback((action, houseId = null) => {
    setLocationPermissionAction(action);
    setLocationPermissionHouseId(houseId);
    setLocationPermissionModal(true);
  }, []);

  const handleLocationPermissionResponse = useCallback(async (allowed) => {
    setLocationPermissionModal(false);
    if (!allowed) return;
    setIsRequestingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      const { latitude, longitude } = position.coords;
      if (locationPermissionAction === 'edit') {
        await updateHouseInfo({
          itineraryId: item?.id,
          id: locationPermissionHouseId,
          user_lat: latitude,
          user_long: longitude,
        }).unwrap();
        setItinerary((prev) => {
          if (!prev) return prev;
          const updated = { ...prev };
          updated.houses = (updated.houses || []).map((h) =>
            h.id === locationPermissionHouseId
              ? { ...h, user_lat: latitude, user_long: longitude }
              : h
          );
          return updated;
        });
        setSelectedHouse((prev) =>
          prev && prev.id === locationPermissionHouseId
            ? { ...prev, user_lat: latitude, user_long: longitude }
            : prev
        );
      } else if (locationPermissionAction === 'create') {
        setNewHouseFields((prev) => ({
          ...prev,
          latitude: String(latitude),
          longitude: String(longitude),
        }));
      }
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Could not get your location. Please check your device settings.");
    } finally {
      setIsRequestingLocation(false);
    }
  }, [locationPermissionAction, locationPermissionHouseId, updateHouseInfo, item?.id]);

  const startEdit = (h) => {
    setEditHouseId(h.id);
    setEditFields({
      first_name: h.first_name ?? "",
      last_name: h.last_name ?? "",
      email: h.email ?? "",
      phone: h.phone ?? "",
      notes: h.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditHouseId(null);
    setEditFields({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      notes: "",
    });
  };

  const saveEdit = async (houseId) => {
    try {
      const payload = {
        id: houseId,
        first_name: editFields.first_name || null,
        last_name: editFields.last_name || null,
        email: editFields.email || null,
        phone: editFields.phone || null,
        notes: editFields.notes || null,
      };
      await updateHouseInfo({ itineraryId: item?.id, ...payload }).unwrap();
      setItinerary((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.houses = (updated.houses || []).map((h) =>
          h.id === houseId ? { ...h, ...payload } : h
        );
        return updated;
      });
      setSelectedHouse((prev) =>
        prev && prev.id === houseId ? { ...prev, ...payload } : prev
      );
      cancelEdit();
    } catch (e) {
      console.error("Failed to update house info:", e);
    }
  };

  const openCreateFormAt = useCallback((lat, lng) => {
    setNewHouseFields({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      latitude: String(lat),
      longitude: String(lng),
      itinerary_id: item?.id ?? null,
      state: "",
      city: "",
      address: "",
      home_value: "",
      homeowner_confirmed: "",
      length_of_residence: "",
    });
    setNewHouseModalOpen(true);
  }, [item?.id]);

  const handleMapClick = useCallback(
    (e) => {
      const latLng = e?.latLng;
      if (!latLng) return;
      const { lat, lng } = latLng.toJSON();
      openCreateFormAt(lat, lng);
    },
    [openCreateFormAt]
  );

  const createNewHouse = async () => {
    try {
      const body = {
        first_name: newHouseFields.first_name || null,
        last_name: newHouseFields.last_name || null,
        phone: newHouseFields.phone || null,
        email: newHouseFields.email || null,
        latitude: newHouseFields.latitude,
        longitude: newHouseFields.longitude,
        itinerary_id: newHouseFields.itinerary_id,
        state: newHouseFields.state || null,
        city: newHouseFields.city || null,
        address: newHouseFields.address || null,
        home_value: newHouseFields.home_value || null,
        homeowner_confirmed: newHouseFields.homeowner_confirmed || null,
        length_of_residence: newHouseFields.length_of_residence || null,
      };
      const res = await createHouse(body).unwrap();
      const newObj = res?.data;
      setItinerary((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        const asHouse = {
          id: newObj?.id ?? Math.random(),
          first_name: newObj?.first_name ?? body.first_name,
          last_name: newObj?.last_name ?? body.last_name,
          phone: newObj?.phone ?? body.phone,
          email: newObj?.email ?? body.email,
          latitude: Number(newObj?.latitude ?? body.latitude),
          longitude: Number(newObj?.longitude ?? body.longitude),
          address: newObj?.address ?? body.address,
          city: newObj?.city ?? body.city,
          state: newObj?.state ?? body.state,
          home_value: newObj?.home_value ?? body.home_value,
          homeowner_confirmed: newObj?.homeowner_confirmed ?? body.homeowner_confirmed,
          length_of_residence: newObj?.length_of_residence ?? body.length_of_residence,
          status: newObj?.status ?? null,
          notes: newObj?.notes ?? null,
          position: {
            lat: Number(newObj?.latitude ?? body.latitude),
            lng: Number(newObj?.longitude ?? body.longitude),
          },
        };
        updated.houses = [...(updated.houses || []), asHouse];
        return updated;
      });
      setNewHouseModalOpen(false);
    } catch (err) {
      console.error("Create house failed:", err);
    }
  };

  if (!open || !window.google) return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center ${
        isFullscreen ? "bg-gray-900" : "bg-black bg-opacity-80"
      }`}
    >
      <div
        className={`relative w-full h-full ${
          isFullscreen ? "" : "max-w-6xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"
        }`}
      >
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={initialCenterRef.current}
          zoom={18}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            gestureHandling: "greedy",
            mapTypeId: mapType,
            clickableIcons: false,
            disableDoubleClickZoom: true,
            styles:
              mapType === "satellite"
                ? []
                : [
                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    {
                      featureType: "administrative.locality",
                      elementType: "labels.text.fill",
                      stylers: [{ color: "#d59563" }],
                    },
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
                    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
                  ],
          }}
        >
          {isRadius && radiusMeters && (
            <Circle
              center={initialCenterRef.current}
              radius={radiusMeters}
              options={{
                fillColor: "#3B82F6",
                fillOpacity: 0.1,
                strokeColor: "#2563EB",
                strokeOpacity: 0.8,
                strokeWeight: 3,
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
                fillOpacity: 0.1,
                strokeColor: "#2563EB",
                strokeOpacity: 0.8,
                strokeWeight: 3,
                clickable: false,
                zIndex: 1,
              }}
            />
          )}
          {houses.map((h) => (
            <MarkerF
              key={h.id ?? `${h.position.lat},${h.position.lng}`}
              position={h.position}
              onMouseOver={() => openInfo(h.id)}
              onMouseOut={closeInfoWithDelay}
              onClick={() => openInfo(h.id)}
              icon={{
                path: "M12 2C7.58 2 4 5.58 4 10c0 5.25 6.5 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z",
                fillColor: "#2563EB",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 1.2,
                anchor: { x: 12, y: 22 },
              }}
            >
              {hoveredHouseId === h.id && (
                <InfoWindowF
                  position={h.position}
                  onCloseClick={() => setHoveredHouseId(null)}
                  options={{
                    pixelOffset: new window.google.maps.Size(0, -10),
                    disableAutoPan: true,
                  }}
                >
                  <div
                    onMouseEnter={() => openInfo(h.id)}
                    onMouseLeave={closeInfoWithDelay}
                    className="min-w-[260px]"
                  >
                    <div className="text-sm font-semibold mb-1">House #{h.id ?? "—"}</div>
                    {editHouseId === h.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 items-center gap-2 text-xs">
                          <label className="font-medium col-span-1">First Name</label>
                          <input
                            className="col-span-2 border rounded px-2 py-1"
                            value={editFields.first_name}
                            onChange={(e) =>
                              setEditFields((s) => ({ ...s, first_name: e.target.value }))
                            }
                            placeholder="First name"
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2 text-xs">
                          <label className="font-medium col-span-1">Last Name</label>
                          <input
                            className="col-span-2 border rounded px-2 py-1"
                            value={editFields.last_name}
                            onChange={(e) =>
                              setEditFields((s) => ({ ...s, last_name: e.target.value }))
                            }
                            placeholder="Last name"
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2 text-xs">
                          <label className="font-medium col-span-1">Email</label>
                          <input
                            className="col-span-2 border rounded px-2 py-1"
                            value={editFields.email}
                            onChange={(e) =>
                              setEditFields((s) => ({ ...s, email: e.target.value }))
                            }
                            placeholder="Email"
                            type="email"
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2 text-xs">
                          <label className="font-medium col-span-1">Phone</label>
                          <input
                            className="col-span-2 border rounded px-2 py-1"
                            value={editFields.phone}
                            onChange={(e) =>
                              setEditFields((s) => ({ ...s, phone: e.target.value }))
                            }
                            placeholder="Phone"
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2 text-xs">
                          <label className="font-medium col-span-1">Notes</label>
                          <textarea
                            className="col-span-2 border rounded px-2 py-1"
                            value={editFields.notes}
                            onChange={(e) =>
                              setEditFields((s) => ({ ...s, notes: e.target.value }))
                            }
                            placeholder="Notes"
                            rows={2}
                          />
                        </div>
                        {saveError && (
                          <div className="text-[11px] text-red-600">
                            {typeof saveError?.data?.message === "string"
                              ? saveError.data.message
                              : "Failed to save. Please try again."}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(h.id)}
                            disabled={isSaving}
                            className={`flex-1 rounded-md ${
                              isSaving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                            } text-white text-sm font-medium px-3 py-2`}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className="flex-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium px-3 py-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-gray-700">
                          <div><span className="font-medium">First&nbsp;Name:</span> {showNull(h.first_name)}</div>
                          <div><span className="font-medium">Last&nbsp;Name:</span> {showNull(h.last_name)}</div>
                          <div><span className="font-medium">Email:</span> {showNull(h.email)}</div>
                          <div><span className="font-medium">Phone:</span> {showPhone(h.phone)}</div>
                          <div><span className="font-medium">Status:</span> {h.status ?? "—"}</div>
                          <div><span className="font-medium">Notes:</span> {showNotes(h.notes)}</div>
                          <div className="mt-1"><span className="font-medium">Address:</span> {h.address ?? "—"}</div>
                          <div><span className="font-medium">User Location:</span> {h.user_lat && h.user_long ? "Recorded" : "Not recorded"}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHouse(h);
                            setLeadModalOpen(true);
                            setHoveredHouseId(null);
                            if (onAddLead) onAddLead(h);
                          }}
                          className="mt-2 w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2"
                        >
                          Add Lead
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(h);
                          }}
                          className="mt-2 w-full rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-2"
                        >
                          Edit House
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestLocationPermission('edit', h.id);
                          }}
                          className="mt-2 w-full rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 flex items-center justify-center gap-1"
                        >
                          <Navigation2 className="w-4 h-4" />
                          Record My Location
                        </button>
                      </>
                    )}
                  </div>
                </InfoWindowF>
              )}
            </MarkerF>
          ))}
        </GoogleMap>
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              {item?.name || "Territory Map"}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isRadius
                ? `Radius: ${item?.radius || 0}km`
                : `Polygon: ${polygonPath.length} points`}{" "}
              • Houses: {houses.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMapType}
              className="p-2 bg-gray-900/90 backdrop-blur-sm rounded-lg shadow hover:bg-gray-800 text-white"
              title="Toggle Map Type"
            >
              <Satellite className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-900/90 backdrop-blur-sm rounded-lg shadow hover:bg-gray-800 text-white"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClose}
              className="p-2 bg-gray-900/90 backdrop-blur-sm rounded-lg shadow hover:bg-gray-800 text-white"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
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
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
            <div className="text-white text-lg flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading territory data...
            </div>
          </div>
        )}
        {leadModalOpen && (
          <FormModel
            open={leadModalOpen}
            onClose={() => setLeadModalOpen(false)}
            house={selectedHouse}
            teritoryId={item?.id}
          />
        )}
        {newHouseModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60">
            <div className="bg-gray-900 text-white w-full max-w-lg rounded-xl shadow-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Add New House</h3>
                <button
                  onClick={() => setNewHouseModalOpen(false)}
                  className="p-1 rounded hover:bg-gray-800"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">First Name</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.first_name}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, first_name: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">Last Name</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.last_name}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, last_name: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">Phone</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.phone}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, phone: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">Email</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    type="email"
                    value={newHouseFields.email}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, email: e.target.value }))}
                    placeholder="john.doe@example.com"
                  />
                </div>
                             <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">Latitude</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.latitude}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, latitude: e.target.value }))}
                    placeholder="Latitude"
                    type="number"
                    step="any"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">Longitude</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.longitude}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, longitude: e.target.value }))}
                    placeholder="Longitude"
                    type="number"
                    step="any"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-300 font-medium">Address</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.address}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, address: e.target.value }))}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">City</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.city}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">State</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.state}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">Home Value</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.home_value}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, home_value: e.target.value }))}
                    placeholder="Home Value"
                    type="number"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-300 font-medium">Homeowner Confirmed</label>
                  <select
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white"
                    value={newHouseFields.homeowner_confirmed}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, homeowner_confirmed: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-300 font-medium">Length of Residence</label>
                  <input
                    className="w-full border border-gray-700 rounded px-2 py-1 bg-gray-800 text-white placeholder-white"
                    value={newHouseFields.length_of_residence}
                    onChange={(e) => setNewHouseFields((s) => ({ ...s, length_of_residence: e.target.value }))}
                    placeholder="Years"
                    type="number"
                  />
                </div>
              </div>
              {createError && (
                <div className="text-[11px] text-red-400 mt-2">
                  {typeof createError?.data?.message === "string"
                    ? createError.data.message
                    : "Failed to create house. Please try again."}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={createNewHouse}
                  disabled={isCreating || isRequestingLocation}
                  className={`flex-1 rounded-md ${
                    isCreating || isRequestingLocation ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                  } text-white text-sm font-medium px-3 py-2`}
                >
                  {isCreating ? "Creating..." : "Create House"}
                </button>
                <button
                  type="button"
                  onClick={() => requestLocationPermission("create")}
                  disabled={isCreating || isRequestingLocation}
                  className={`flex-1 rounded-md ${
                    isCreating || isRequestingLocation ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
                  } text-white text-sm font-medium px-3 py-2 flex items-center justify-center gap-1`}
                >
                  <Navigation2 className="w-4 h-4" />
                  Use My Location
                </button>
              </div>
            </div>
          </div>
        )}
        {locationPermissionModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60">
            <div className="bg-gray-900 text-white w-full max-w-sm rounded-xl shadow-xl p-4">
              <h3 className="text-lg font-semibold mb-3">Allow Location Access</h3>
              <p className="text-sm text-gray-300 mb-4">
                We need your permission to access your location to {locationPermissionAction === "create" ? "set the house location" : "record your current location"}.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLocationPermissionResponse(true)}
                  className="flex-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2"
                >
                  Allow
                </button>
                <button
                  onClick={() => handleLocationPermissionResponse(false)}
                  className="flex-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium px-3 py-2"
                >
                  Deny
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}