import React, { useState, useRef, useEffect } from "react";
import {
  MapPin, Edit3, Trash2, Eye, EyeOff, Search,
  Download, Upload, Layers, Triangle, Map, X,
  ChevronDown, ChevronRight, Save, Loader2
} from "lucide-react";
import TerritoryDetailMapModal from "./DetailedTerritory"; // Make sure this file is present

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  document.body.appendChild(script);
}

const TerritoryCreator = () => {
  const [detailedTerritory, setDetailedTerritory] = useState(null);

  const [territories, setTerritories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [pendingArea, setPendingArea] = useState(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [importExportModal, setImportExportModal] = useState(false);
  const [importData, setImportData] = useState("");
  const [suggestedName, setSuggestedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [color, setColor] = useState("#3B82F6");
  const [showColorPicker, setShowColorPicker] = useState(false);
const [selectedTerritory, setSelectedTerritory] = useState(null);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const drawnPolygons = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  const colors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
    "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"
  ];

  // Initialize map and services
  useEffect(() => {
    window.initMap = () => {
      const texasCenter = { lat: 31.9686, lng: -99.9018 };
      const map = new window.google.maps.Map(mapRef.current, {
        center: texasCenter,
        zoom: 6,
        mapTypeId: "hybrid",
        streetViewControl: false,
        fullscreenControl: true,
        mapTypeControl: true,
        styles: [
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillColor: color,
          fillOpacity: 0.3,
          strokeWeight: 3,
          strokeColor: color,
          clickable: false,
          editable: true,
          zIndex: 1,
        },
      });

      drawingManager.setMap(map);

      window.google.maps.event.addListener(
        drawingManager,
        "overlaycomplete",
        function (event) {
          if (event.type === "polygon") {
            const path = event.overlay.getPath();
            let coordinates = [];
            for (let i = 0; i < path.getLength(); i++) {
              const latLng = path.getAt(i);
              coordinates.push({ lat: latLng.lat(), lng: latLng.lng() });
            }
            const area = window.google.maps.geometry.spherical.computeArea(path);
            setPendingCoords(coordinates);
            setPendingArea(area);
            setLoading(true);

            // Get center point of the polygon for reverse geocoding
            const bounds = new window.google.maps.LatLngBounds();
            coordinates.forEach(coord => bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng)));
            const center = bounds.getCenter();

            // Reverse geocode to get location name
            new window.google.maps.Geocoder().geocode(
              { location: center },
              (results, status) => {
                setLoading(false);
                if (status === "OK" && results[0]) {
                  const address = results[0].address_components;
                  let name = "";

                  const neighborhood = address.find(c => c.types.includes("neighborhood"));
                  const locality = address.find(c => c.types.includes("locality"));
                  const adminArea = address.find(c => c.types.includes("administrative_area_level_2"));

                  if (neighborhood) {
                    name = neighborhood.long_name;
                  } else if (locality) {
                    name = locality.long_name;
                  } else if (adminArea) {
                    name = adminArea.long_name;
                  } else {
                    name = results[0].formatted_address.split(",")[0];
                  }

                  setSuggestedName(name);
                } else {
                  setSuggestedName(`Territory ${territories.length + 1}`);
                }
                setModalOpen(true);
              }
            );

            event.overlay.setMap(null);
            setDrawingMode(false);
            drawingManager.setDrawingMode(null);
          }
        }
      );

      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(map);

      window.mapInstance = map;
      window.drawingManagerInstance = drawingManager;
      setMapLoaded(true);
    };

    if (!window.google) {
      loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry,places&callback=initMap`
      );
    } else {
      window.initMap();
    }
  }, [color, territories.length]);
// When clicking on a territory
const handleTerritoryClick = (territory) => {
  setSelectedTerritory(territory);

};
  // Handle search functionality
  const handleSearch = () => {
    if (!searchQuery.trim() || !autocompleteService.current) return;

    autocompleteService.current.getPlacePredictions(
      {
        input: searchQuery,
        componentRestrictions: { country: "us" },
        types: ['geocode']
      },
      (predictions, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          setSearchResults([]);
          return;
        }
        setSearchResults(predictions);
        setShowSearchResults(true);
      }
    );
  };

  // Handle search result selection
  const handleSelectResult = (placeId) => {
    if (!placesService.current) return;

    placesService.current.getDetails({ placeId }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
        window.mapInstance.panTo(place.geometry.location);
        window.mapInstance.setZoom(15);
        setShowSearchResults(false);
        setSearchQuery(place.formatted_address);
      }
    });
  };

  // Update territories on map
  useEffect(() => {
    if (!mapLoaded || !window.mapInstance) return;

    drawnPolygons.current.forEach(polygon => polygon.setMap(null));
    drawnPolygons.current = [];

    territories
      .filter(t => activeTab === "all" || (activeTab === "visible" ? t.visible : !t.visible))
      .forEach((territory) => {
        if (territory.coordinates && territory.coordinates.length > 0) {
          const polygon = new window.google.maps.Polygon({
            paths: territory.coordinates,
            strokeColor: territory.color || color,
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: territory.color || color,
            fillOpacity: territory.visible ? 0.2 : 0.05,
            clickable: true
          });

          polygon.setMap(window.mapInstance);
          drawnPolygons.current.push(polygon);
        }
      });
  }, [territories, mapLoaded, activeTab, color]);

  const toggleDrawing = () => {
    if (!window.drawingManagerInstance) return;

    const newMode = !drawingMode;
    setDrawingMode(newMode);

    if (newMode) {
      window.drawingManagerInstance.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
    } else {
      window.drawingManagerInstance.setDrawingMode(null);
    }
  };

  const handleSave = (territoryData) => {
    if (editIndex !== null) {
      const updated = [...territories];
      updated[editIndex] = {
        ...updated[editIndex],
        ...territoryData,
        color: color
      };
      setTerritories(updated);
      setEditIndex(null);
    } else {
      setTerritories([
        ...territories,
        {
          ...territoryData,
          coordinates: pendingCoords,
          area: pendingArea,
          id: Date.now(),
          visible: true,
          color: color
        }
      ]);
    }
    setModalOpen(false);
    setPendingCoords(null);
    setPendingArea(null);
    setColor("#3B82F6");
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setColor(territories[index].color || "#3B82F6");
    setModalOpen(true);
  };

  const handleDelete = (index) => {
    if (confirm('Are you sure you want to delete this territory?')) {
      setTerritories(territories.filter((_, i) => i !== index));
    }
  };

  const handleToggleVisibility = (index) => {
    const updated = [...territories];
    updated[index].visible = !updated[index].visible;
    setTerritories(updated);
  };

  const formatArea = (area) => {
    if (area > 1000000) return `${(area / 1000000).toFixed(2)} km²`;
    return `${(area / 1000).toFixed(2)} m²`;
  };

  const exportTerritories = () => {
    const dataStr = JSON.stringify(territories, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `territories-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importTerritories = () => {
    try {
      const parsedData = JSON.parse(importData);
      if (Array.isArray(parsedData)) {
        setTerritories(parsedData);
        setImportExportModal(false);
        setImportData("");
      } else {
        alert("Invalid format. Please provide an array of territories.");
      }
    } catch (e) {
      alert("Error parsing JSON: " + e.message);
    }
  };

  const filteredTerritories = territories.filter(t =>
    activeTab === "all" || (activeTab === "visible" ? t.visible : !t.visible)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Territory Creator</h1>
            <p className="text-gray-400 text-sm">Draw, manage and analyze your territories</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setImportExportModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 text-sm"
            >
              <span className="hidden sm:inline">Import/Export</span>
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="relative mb-8">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 w-full max-w-xs">
            <div className="relative">
              <div className="flex bg-gray-800 backdrop-blur-md rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search location..."
                  className="px-4 py-2 bg-transparent text-white w-full focus:outline-none placeholder-gray-400"
                />
                <button
                  onClick={handleSearch}
                  className="px-3 bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700"
                >
                  <Search size={18} />
                </button>
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-12 left-0 w-full bg-gray-800 backdrop-blur-lg rounded-lg border border-gray-700 shadow-xl z-20 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.place_id}
                      className="p-3 hover:bg-gray-700 cursor-pointer text-white border-b border-gray-700 last:border-b-0"
                      onClick={() => handleSelectResult(result.place_id)}
                    >
                      <div className="font-medium">{result.structured_formatting.main_text}</div>
                      <div className="text-sm text-gray-300">{result.structured_formatting.secondary_text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleDrawing}
                className={`px-4 py-2 rounded-lg font-medium transition-all shadow-lg flex-1 flex items-center justify-center gap-2 ${
                  drawingMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {drawingMode ? (
                  <>
                    <X size={16} />
                    <span className="hidden sm:inline">Cancel</span>
                  </>
                ) : (
                  <>
                    <Triangle size={16} />
                    <span className="hidden sm:inline">Draw</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            className="rounded-xl overflow-hidden shadow-xl border border-gray-700"
            style={{ minHeight: 500, background: "#1f2937" }}
          >
            <div ref={mapRef} style={{ width: "100%", height: 500 }} />
          </div>
        </div>

        <div className="bg-gray-800 backdrop-blur-xl rounded-xl border border-gray-700 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">Your Territories</h2>

            <div className="flex gap-2 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 text-sm rounded-md ${activeTab === "all" ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("visible")}
                className={`px-3 py-1 text-sm rounded-md ${activeTab === "visible" ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
              >
                Visible
              </button>
              <button
                onClick={() => setActiveTab("hidden")}
                className={`px-3 py-1 text-sm rounded-md ${activeTab === "hidden" ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
              >
                Hidden
              </button>
            </div>
          </div>

          {filteredTerritories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {activeTab === "all"
                ? "No territories created yet. Click 'Draw' to get started!"
                : activeTab === "visible"
                  ? "No visible territories"
                  : "No hidden territories"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTerritories.map((territory, index) => (
                <div key={index} className={`bg-gray-700 rounded-lg border ${territory.visible ? 'border-indigo-500/30' : 'border-gray-600'} p-4 transition-all hover:shadow-lg`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {territory.name}
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: territory.color || color }}
                        />
                      </h3>
                      <p className="text-gray-300 text-sm">{territory.desc || 'No description'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleVisibility(index)}
                        className={`p-1.5 rounded-lg ${territory.visible ? 'bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
                        title={territory.visible ? "Hide territory" : "Show territory"}
                      >
                        {territory.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => handleEdit(index)}
                        className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300"
                        title="Edit territory"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300"
                        title="Delete territory"
                      >
                        <Trash2 size={16} />
                      </button>
                      {/* --- Yahan se naya Detailed Map button add kiya gaya hai --- */}
                      <button
                         onClick={() => setSelectedTerritory(territory)}
                        className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-300"
                        title="Detailed Map View"
                      >
                        <Map size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-600/50 rounded-lg p-2">
                      <div className="text-gray-400 flex items-center gap-1">
                        <MapPin size={14} />
                        Points
                      </div>
                      <div className="text-white font-semibold">{territory.coordinates?.length || 0}</div>
                    </div>
                    <div className="bg-gray-600/50 rounded-lg p-2">
                      <div className="text-gray-400">Area</div>
                      <div className="text-white font-semibold">{territory.area ? formatArea(territory.area) : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Territory Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editIndex !== null ? "Edit Territory" : "Add New Territory"}
                </h2>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setEditIndex(null);
                    setPendingCoords(null);
                    setPendingArea(null);
                    setColor("#3B82F6");
                  }}
                  className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                  <span className="ml-2 text-gray-300">Detecting location...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Territory Name *</label>
                    <input
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter territory name"
                      defaultValue={editIndex !== null ? territories[editIndex].name : suggestedName}
                    />
                    {suggestedName && !editIndex && (
                      <p className="text-xs text-gray-400 mt-1">
                        Suggested name based on location: {suggestedName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Description</label>
                    <textarea
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Enter description (optional)"
                      rows="3"
                      defaultValue={editIndex !== null ? territories[editIndex].desc : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Color</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
                        {showColorPicker ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {showColorPicker && (
                        <div className="absolute z-10 mt-2 p-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg grid grid-cols-4 gap-2">
                          {colors.map((c) => (
                            <button
                              key={c}
                              onClick={() => {
                                setColor(c);
                                setShowColorPicker(false);
                              }}
                              className="w-8 h-8 rounded-full hover:ring-2 hover:ring-white focus:outline-none"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {pendingCoords && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <MapPin size={16} />
                        <span>{pendingCoords.length} points selected</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-400 overflow-x-auto">
                        <code className="bg-gray-800 p-1 rounded">
                          {JSON.stringify(pendingCoords)}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setEditIndex(null);
                    setPendingCoords(null);
                    setPendingArea(null);
                    setColor("#3B82F6");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const name = document.querySelector('input').value || suggestedName || `Territory #${Date.now()}`;
                    const desc = document.querySelector('textarea').value;
                    handleSave({ name, desc });
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {editIndex !== null ? "Update" : "Save"} Territory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {importExportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Import/Export Territories</h2>
                <button
                  onClick={() => {
                    setImportExportModal(false);
                    setImportData("");
                  }}
                  className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Download size={18} />
                    <span>Export Territories</span>
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Export all your territories as a JSON file that can be imported later.
                  </p>
                  <button
                    onClick={exportTerritories}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    <span>Export as JSON</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Upload size={18} />
                    <span>Import Territories</span>
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Paste your JSON data to import territories. This will replace your current territories.
                  </p>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm font-mono"
                    placeholder={`[\n  {\n    "name": "Territory 1",\n    "coordinates": [{ "lat": 31.9686, "lng": -99.9018 }],\n    ...\n  }\n]`}
                    rows="8"
                  />
                  <button
                    onClick={importTerritories}
                    disabled={!importData.trim()}
                    className={`w-full px-4 py-2 mt-2 text-white rounded-lg flex items-center justify-center gap-2 ${
                      importData.trim()
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Upload size={16} />
                    <span>Import Territories</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Map Modal (NEW) */}
      <TerritoryDetailMapModal
  territory={selectedTerritory}
 open={!!selectedTerritory}
    onClose={() => setSelectedTerritory(null)}
/>
    </div>
  );
};

export default TerritoryCreator;
