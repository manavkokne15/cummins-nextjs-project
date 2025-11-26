"use client";

import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useState, useEffect, useCallback } from "react";

const layoutStyle = {
  display: "flex",
  width: "100%",
  height: "100vh",
  overflow: "hidden",
};

const legendStyle = {
  width: "25%",
  background: "#f8f8f8",
  padding: "20px",
  borderRight: "1px solid #ddd",
  overflowY: "auto",
};

const mapContainerStyle = {
  width: "75%",
  height: "100vh",
};

const DEFAULT_CENTER = { lat: 39.5, lng: -98.35 };

export default function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [map, setMap] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    petrol: true,
    diesel: true,
    ev: true,
  });

  const onLoad = useCallback((mapInst) => {
    setMap(mapInst);
  }, []);

  // Load CSV
  useEffect(() => {
    if (!isLoaded) return;

    fetch("/fuel_stations.csv")
      .then((res) => res.text())
      .then((text) => {
        const rows = text.split("\n").slice(1);

        const parsed = rows
          .map((row) => row.trim())
          .filter((row) => row.length > 0)
          .map((row) => {
            const [Latitude, Longitude, station_id, fuel_type] = row.split(",");
            return {
              lat: parseFloat(Latitude),
              lng: parseFloat(Longitude),
              station_id,
              fuel_type: fuel_type.toLowerCase(),
            };
          });

        setStations(parsed);
      });
  }, [isLoaded]);

  // Filtered stations based on selected fuel types
  const filteredStations = stations.filter((s) => filters[s.fuel_type]);

  // Auto Fit Bounds (whenever filtered stations change)
  useEffect(() => {
    if (!map || filteredStations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    filteredStations.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds);
  }, [map, filteredStations]);

  if (!isLoaded) return <p>Loading map…</p>;

  // Marker icons
  const iconMap = {
    diesel: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    petrol: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    ev: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  };

  // Toggle checkbox
  const toggleFilter = (fuel) => {
    setFilters((prev) => ({ ...prev, [fuel]: !prev[fuel] }));
  };

  return (
    <div style={layoutStyle}>
      {/* LEFT SIDE PANEL */}
      <div style={legendStyle}>
        <h2>Fuel Station Legends</h2>

        {/* Legends */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <img src={iconMap.petrol} width={24} style={{ marginRight: 10 }} />
          <span>Petrol Stations</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <img src={iconMap.diesel} width={24} style={{ marginRight: 10 }} />
          <span>Diesel Stations</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <img src={iconMap.ev} width={24} style={{ marginRight: 10 }} />
          <span>EV Charging</span>
        </div>

        <hr style={{ margin: "20px 0" }} />

        <h3>Filters</h3>

        {/* FILTERS UI */}
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={filters.petrol}
              onChange={() => toggleFilter("petrol")}
            />{" "}
            Petrol
          </label>

          <label style={{ display: "block", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={filters.diesel}
              onChange={() => toggleFilter("diesel")}
            />{" "}
            Diesel
          </label>

          <label style={{ display: "block", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={filters.ev}
              onChange={() => toggleFilter("ev")}
            />{" "}
            EV Charging
          </label>
        </div>

        <hr style={{ margin: "20px 0" }} />
        <h3>Stations Displayed: {filteredStations.length}</h3>
      </div>

      {/* RIGHT SIDE → MAP */}
      <GoogleMap
        onLoad={onLoad}
        mapContainerStyle={mapContainerStyle}
        center={DEFAULT_CENTER}
        zoom={4}
      >
        {/* Markers */}
        {filteredStations.map((s) => (
          <Marker
            key={s.station_id}
            position={{ lat: s.lat, lng: s.lng }}
            icon={{ url: iconMap[s.fuel_type] }}
            onClick={() => setSelectedStation(s)}
          />
        ))}

        {/* Info Window */}
        {selectedStation && (
          <InfoWindow
            position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
            onCloseClick={() => setSelectedStation(null)}
          >
            <div style={{ minWidth: "160px" }}>
              <h4 style={{ margin: "0 0 10px" }}>{selectedStation.station_id}</h4>
              <p style={{ margin: 0 }}>
                <strong>Fuel Type:</strong> {selectedStation.fuel_type.toUpperCase()}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Lat:</strong> {selectedStation.lat}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Lng:</strong> {selectedStation.lng}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
