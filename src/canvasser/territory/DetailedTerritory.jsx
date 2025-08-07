import React, { useEffect, useRef, useState } from "react";
import {
  X, MapPin, Maximize2, Minimize2, ZoomIn, ZoomOut, Compass
} from "lucide-react";

const GOOGLE_MAPS_API_KEY = "YAIzaSyAbYMI1QRvJhV1tRFRdMIGvPj2wP3p358Q"; // apni key use karo

const loadScript = (src, callback) => {
  if (document.querySelector(`script[src="${src}"]`)) {
    if (window.google && callback) callback();
    return;
  }
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = callback;
  document.body.appendChild(script);
};

const formatArea = (area) => {
  if (!area) return "N/A";
  if (area > 1000000) return `${(area / 1000000).toFixed(2)} km²`;
  return `${(area / 1000).toFixed(2)} m²`;
};

// --- Dummy owner data ---
const dummyOwners = [
  { name: "Ahmed Khan", phone: "0300-1234567", email: "ahmed@example.com" },
  { name: "Rabia Iqbal", phone: "0311-7894561", email: "rabia@xyz.com" },
  { name: "Usman Ali", phone: "0334-5552221", email: "usman@hotmail.com" },
  { name: "Maria Shafiq", phone: "0345-9922011", email: "maria@gmail.com" }
];

const DetailedTerritoryMap = ({
  coordinates,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  const mapRef = useRef(null);
  const polygonRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [userMarkers, setUserMarkers] = useState([]);
  const markerObjsRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const [openInfoIdx, setOpenInfoIdx] = useState(null);

  // 1. Map + Polygon + Polygon click
  useEffect(() => {
    if (!window.google || !coordinates?.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach(coord =>
      bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng))
    );

    const map = new window.google.maps.Map(mapRef.current, {
      center: bounds.getCenter(),
      zoom: 16,
      mapTypeId: "hybrid",
      disableDefaultUI: true,
      gestureHandling: "greedy",
      minZoom: 12,
      maxZoom: 20,
      styles: [
        { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#fff" }] },
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });

    setMapInstance(map);

    // Create polygon
    polygonRef.current = new window.google.maps.Polygon({
      paths: coordinates,
      strokeColor: "#3B82F6",
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: "#3B82F6",
      fillOpacity: 0.25,
      map,
      zIndex: 10,
    });

    // Polygon click: add marker
    polygonRef.current.addListener("click", (e) => {
      const randomOwner = dummyOwners[Math.floor(Math.random() * dummyOwners.length)];
      setUserMarkers((prev) => [
        ...prev,
        {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          status: "not visited",
          owner: randomOwner
        }
      ]);
    });

    map.fitBounds(bounds);

    // Boundary markers
    coordinates.forEach((coord, index) => {
      new window.google.maps.Marker({
        position: coord,
        map,
        label: {
          text: (index + 1).toString(),
          color: "#fff",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
        zIndex: 20 + index,
      });
    });

    return () => {
      if (polygonRef.current) polygonRef.current.setMap(null);
    };
  }, [coordinates]);

  // 2. Expose Controls
  useEffect(() => {
    if (!mapInstance) return;
    const zoomIn = () => {
      const currentZoom = mapInstance.getZoom();
      mapInstance.setZoom(Math.min(currentZoom + 1, 20));
    };
    const zoomOut = () => {
      const currentZoom = mapInstance.getZoom();
      mapInstance.setZoom(Math.max(currentZoom - 1, 12));
    };
    const resetView = () => {
      const bounds = new window.google.maps.LatLngBounds();
      coordinates.forEach(coord =>
        bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng))
      );
      mapInstance.fitBounds(bounds);
    };
    onZoomIn.current = zoomIn;
    onZoomOut.current = zoomOut;
    onResetView.current = resetView;
  }, [mapInstance, coordinates, onZoomIn, onZoomOut, onResetView]);

  // 3. Map click to add marker (with owner info)
  useEffect(() => {
    if (!mapInstance) return;
    const clickListener = mapInstance.addListener("click", (e) => {
      const randomOwner = dummyOwners[Math.floor(Math.random() * dummyOwners.length)];
      setUserMarkers((prev) => [
        ...prev,
        {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          status: "not visited",
          owner: randomOwner
        }
      ]);
    });
    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, [mapInstance]);

  // 4. Render user markers & InfoWindows
  useEffect(() => {
    if (!mapInstance) return;
    // Clean previous
    markerObjsRef.current.forEach(markerObj => markerObj.setMap(null));
    infoWindowsRef.current.forEach(iw => iw.close());
    markerObjsRef.current = [];
    infoWindowsRef.current = [];

    userMarkers.forEach((marker, idx) => {
      // Make marker
      const gMarker = new window.google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: mapInstance,
        label: marker.status === "visited" ? "✔" : "✗",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: marker.status === "visited" ? "#22c55e" : "#f59e42",
          fillOpacity: 1,
          strokeColor: "#222",
          strokeWeight: 2,
        },
        zIndex: 100 + idx,
      });

      // InfoWindow content
      const iwContent = `
        <div style="font-family:sans-serif;min-width:180px;max-width:240px;padding:6px 2px;">
          <div style="font-size:15px;font-weight:bold;color:#222;">🏠 ${marker.owner?.name || "Unknown Owner"}</div>
          <div style="font-size:13px;color:#333;">
            <div><b>Phone:</b> ${marker.owner?.phone || "N/A"}</div>
            <div><b>Email:</b> ${marker.owner?.email || "N/A"}</div>
            <div><b>Status:</b> 
              <span style="color:${marker.status === "visited" ? "#22c55e" : "#f59e42"};">
                ${marker.status === "visited" ? "Visited" : "Not Visited"}
              </span>
            </div>
          </div>
          <div style="font-size:11px;color:#aaa;margin-top:3px;">(Click marker to toggle status)</div>
        </div>
      `;
      const infoWindow = new window.google.maps.InfoWindow({
        content: iwContent,
        maxWidth: 240,
      });

      // Marker click: toggle status & show InfoWindow
      gMarker.addListener("click", () => {
        // Toggle status
        setUserMarkers((prev) =>
          prev.map((m, i) =>
            i === idx
              ? { ...m, status: m.status === "not visited" ? "visited" : "not visited" }
              : m
          )
        );
        // Open InfoWindow
        setOpenInfoIdx(idx);
      });

      // Save references
      markerObjsRef.current.push(gMarker);
      infoWindowsRef.current.push(infoWindow);
    });

    // Open InfoWindow if required
    if (openInfoIdx !== null && infoWindowsRef.current[openInfoIdx] && markerObjsRef.current[openInfoIdx]) {
      infoWindowsRef.current.forEach((iw, idx) => { if (idx !== openInfoIdx) iw.close(); });
      infoWindowsRef.current[openInfoIdx].open({
        anchor: markerObjsRef.current[openInfoIdx],
        map: mapInstance,
        shouldFocus: false,
      });
    } else {
      infoWindowsRef.current.forEach(iw => iw.close());
    }

    return () => {
      markerObjsRef.current.forEach(markerObj => markerObj.setMap(null));
      infoWindowsRef.current.forEach(iw => iw.close());
    };
    // eslint-disable-next-line
  }, [userMarkers, mapInstance, openInfoIdx]);

  // Close InfoWindow when map is clicked
  useEffect(() => {
    if (!mapInstance) return;
    const closeListener = mapInstance.addListener("click", () => setOpenInfoIdx(null));
    return () => {
      window.google.maps.event.removeListener(closeListener);
    };
  }, [mapInstance]);

  return (
    <div
      ref={mapRef}
      className="relative"
      style={{
        width: "100%",
        height: isFullscreen ? "calc(100vh - 120px)" : "500px",
      }}
    >
      {isFullscreen && (
        <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
          <button
            onClick={() => onZoomIn.current?.()}
            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 shadow-lg"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => onZoomOut.current?.()}
            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 shadow-lg"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={() => onResetView.current?.()}
            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 shadow-lg"
            title="Reset View"
          >
            <Compass size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

const TerritoryDetailMapModal = ({ territory, open, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const zoomInRef = useRef(() => {});
  const zoomOutRef = useRef(() => {});
  const resetViewRef = useRef(() => {});
  const [googleLoaded, setGoogleLoaded] = useState(!!window.google);

  // Google Maps Script Loader
  useEffect(() => {
    if (!open) return;
    if (!window.google) {
      loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`,
        () => setGoogleLoaded(true)
      );
    } else {
      setGoogleLoaded(true);
    }
  }, [open]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  if (!open || !territory) return null;
  if (!googleLoaded)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]">
        <div className="text-white text-lg">Loading Map...</div>
      </div>
    );

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${isFullscreen ? "p-0" : "p-4"}`}
      style={{
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className={`bg-gray-900 border border-gray-700 shadow-2xl w-full ${isFullscreen ? "h-screen rounded-none border-0" : "max-w-6xl rounded-xl"}`}
        style={{
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b border-gray-800"
          style={{
            zIndex: 1002,
            position: "relative",
            backgroundColor: "#1a1a1a",
          }}
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin size={20} />
            {territory.name}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Map container */}
        <div className="flex-1 relative">
          <DetailedTerritoryMap
            coordinates={territory.coordinates}
            isFullscreen={isFullscreen}
            onZoomIn={zoomInRef}
            onZoomOut={zoomOutRef}
            onResetView={resetViewRef}
          />
        </div>

        {/* Footer */}
        {!isFullscreen && (
          <div
            className="p-4 border-t border-gray-800"
            style={{
              zIndex: 1002,
              position: "relative",
              backgroundColor: "#1a1a1a",
            }}
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm">Boundary Points</div>
                <div className="text-white font-semibold">{territory.coordinates?.length || 0}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm">Total Area</div>
                <div className="text-white font-semibold">{formatArea(territory.area)}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm">Color Code</div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: territory.color || "#3B82F6" }}
                  />
                  <span className="text-white text-sm">
                    {territory.color || "#3B82F6"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerritoryDetailMapModal;
