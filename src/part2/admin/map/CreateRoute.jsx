import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import * as XLSX from 'xlsx';

const MapWithExcelImport = () => {
  const [houseData, setHouseData] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 32.7767, lng: -96.7970 });
  const [mapZoom, setMapZoom] = useState(10);

  const mapContainerStyle = {
    width: '100%',
    height: '600px'
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const processedData = jsonData.map((row, index) => ({
        id: row.household_id || `house-${index}`,
        address: row.street_address,
        city: row.city,
        state: row.state_province,
        postalCode: row.postal_code,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        voterName: row.voter_name,
        registeredVoters: row.registered_voters,
        partyAffiliation: row.party_affiliation,
        votingHistory: row.voting_history,
        assignedCanvasser: row.assigned_canvasser,
        canvassingStatus: row.canvassing_status,
        notes: row.notes
      })).filter(house => !isNaN(house.latitude) && !isNaN(house.longitude));

      setHouseData(processedData);

      if (processedData.length > 0) {
        setMapCenter({
          lat: processedData[0].latitude,
          lng: processedData[0].longitude
        });
        setMapZoom(12);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const onLoad = useCallback((map) => {
    // Map loaded callback
  }, []);

  const onUnmount = useCallback((map) => {
    // Map unmount callback
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">House Canvassing Map</h1>
          <p className="text-gray-600 mb-6">
            Import your Excel/CSV file to display house locations on the map
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel/CSV File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Supported formats: .xlsx, .xls, .csv
            </p>
          </div>

          {houseData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Houses</p>
                <p className="text-2xl font-bold text-blue-700">{houseData.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Democrat</p>
                <p className="text-2xl font-bold text-green-700">
                  {houseData.filter(house => house.partyAffiliation === 'Democrat').length}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Republican</p>
                <p className="text-2xl font-bold text-red-700">
                  {houseData.filter(house => house.partyAffiliation === 'Republican').length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Undecided</p>
                <p className="text-2xl font-bold text-purple-700">
                  {houseData.filter(house => house.partyAffiliation === 'Undecided').length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Google Map - Remove LoadScript wrapper */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {houseData.map((house) => (
              <Marker
                key={house.id}
                position={{ lat: house.latitude, lng: house.longitude }}
                onClick={() => setSelectedHouse(house)}
                icon={{
                  url: getMarkerIcon(house.partyAffiliation),
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ))}

            {selectedHouse && (
              <InfoWindow
                position={{
                  lat: selectedHouse.latitude,
                  lng: selectedHouse.longitude
                }}
                onCloseClick={() => setSelectedHouse(null)}
              >
                <div className="p-2 max-w-xs">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {selectedHouse.voterName}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Address:</span>{' '}
                      {selectedHouse.address}, {selectedHouse.city}, {selectedHouse.state} {selectedHouse.postalCode}
                    </p>
                    <p>
                      <span className="font-medium">Registered Voters:</span>{' '}
                      {selectedHouse.registeredVoters}
                    </p>
                    <p>
                      <span className="font-medium">Party:</span>{' '}
                      <span className={`font-semibold ${getPartyColor(selectedHouse.partyAffiliation)}`}>
                        {selectedHouse.partyAffiliation}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Voting History:</span>{' '}
                      {selectedHouse.votingHistory}
                    </p>
                    <p>
                      <span className="font-medium">Canvasser:</span>{' '}
                      {selectedHouse.assignedCanvasser}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      {selectedHouse.canvassingStatus}
                    </p>
                    {selectedHouse.notes && (
                      <p>
                        <span className="font-medium">Notes:</span>{' '}
                        {selectedHouse.notes}
                      </p>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        {houseData.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Imported House Data</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voter Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Party
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {houseData.map((house) => (
                    <tr 
                      key={house.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedHouse(house);
                        setMapCenter({ lat: house.latitude, lng: house.longitude });
                        setMapZoom(15);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {house.voterName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {house.address}, {house.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartyBadgeColor(house.partyAffiliation)}`}>
                          {house.partyAffiliation}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {house.canvassingStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions remain the same
const getMarkerIcon = (party) => {
  const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
  switch (party) {
    case 'Democrat':
      return baseUrl + 'blue-dot.png';
    case 'Republican':
      return baseUrl + 'red-dot.png';
    case 'Undecided':
      return baseUrl + 'yellow-dot.png';
    case 'Independent':
      return baseUrl + 'green-dot.png';
    default:
      return baseUrl + 'purple-dot.png';
  }
};

const getPartyColor = (party) => {
  switch (party) {
    case 'Democrat':
      return 'text-blue-600';
    case 'Republican':
      return 'text-red-600';
    case 'Undecided':
      return 'text-yellow-600';
    case 'Independent':
      return 'text-green-600';
    default:
      return 'text-purple-600';
  }
};

const getPartyBadgeColor = (party) => {
  switch (party) {
    case 'Democrat':
      return 'bg-blue-100 text-blue-800';
    case 'Republican':
      return 'bg-red-100 text-red-800';
    case 'Undecided':
      return 'bg-yellow-100 text-yellow-800';
    case 'Independent':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-purple-100 text-purple-800';
  }
};

export default MapWithExcelImport;