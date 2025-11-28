"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useCallback } from "react";
import { layoutStyle } from '@/constants/mapConfig';
import MapLegendPanel from './MapLegendPanel';
import MapView from './MapView';

const libraries = ['places', 'visualization'];

export default function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [map, setMap] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    elec: true,    
    cng: true,      
    lng: true,      
    bd: true,      
    e85: true,     
    hy: true,      
    lpg: true,     
  });

  const onLoad = useCallback((mapInst) => {
    setMap(mapInst);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    fetch("/api/fuel-stations")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setStations(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch stations");
        }
      })
      .catch((err) => {
        console.error("Error fetching fuel stations:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isLoaded]);

  const getFuelTypeKey = (fuelType) => {
    if (!fuelType) return 'unknown';
    return fuelType.toLowerCase();
  };

  const filteredStations = stations.filter((s) => {
    const fuelKey = getFuelTypeKey(s.fuel_type);
    return filters[fuelKey] !== undefined ? filters[fuelKey] : true;
  });

  useEffect(() => {
    if (!map || filteredStations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    filteredStations.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds);
  }, [map, filteredStations]);

  const toggleFilter = (fuel) => {
    setFilters((prev) => ({ ...prev, [fuel]: !prev[fuel] }));
  };

  if (!isLoaded) return <p>Loading map…</p>;
  if (loading) return <p>Loading fuel stations from BigQuery…</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={layoutStyle}>
      <MapLegendPanel 
        filters={filters}
        toggleFilter={toggleFilter}
        stationCount={filteredStations.length}
      />
      <MapView 
        onLoad={onLoad}
        filteredStations={filteredStations}
        selectedStation={selectedStation}
        setSelectedStation={setSelectedStation}
      />
    </div>
  );
}