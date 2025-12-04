"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useCallback } from "react";
import MapLegendPanel from './MapLegendPanel';
import MapView from './MapView';

const libraries = ['places'];
import styles from './MapComponent.module.css';

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
    elec: false,    
    cng: true,
  });

  const [regionFilter, setRegionFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  // Region mapping for US states
  const getRegionMatch = (station, selectedRegion) => {
    if (!selectedRegion || selectedRegion === 'all' || !station.state) return true;
    
    const stateCode = station.state.toUpperCase();
    
    // US Regions mapping
    const regions = {
      northeast: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
      southeast: ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV', 'AL', 'KY', 'MS', 'TN', 'AR', 'LA'],
      midwest: ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'],
      southwest: ['AZ', 'NM', 'OK', 'TX'],
      west: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY']
    };
    
    return regions[selectedRegion]?.includes(stateCode) || false;
  };

  const filteredStations = stations.filter((s) => {
    // Fuel type filter
    const fuelKey = getFuelTypeKey(s.fuel_type);
    const fuelMatch = filters[fuelKey] !== undefined ? filters[fuelKey] : true;
    
    // Region filter (by US geographic regions)
    const regionMatch = getRegionMatch(s, regionFilter);
    
    // Ownership filter
    const ownershipMatch = ownershipFilter === 'all' || 
      s.access_code?.toLowerCase() === ownershipFilter.toLowerCase();
    
    return fuelMatch && regionMatch && ownershipMatch;
  });

  // Removed auto-zoom functionality - map stays at default US center view
  // Stations are filtered but map doesn't zoom to specific regions

  const toggleFilter = (fuel) => {
    setFilters((prev) => ({ ...prev, [fuel]: !prev[fuel] }));
  };

  if (!isLoaded) return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading map…</div>
    </div>
  );
  
  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading fuel stations from BigQuery…</div>
    </div>
  );
  
  if (error) return (
    <div className={styles.container}>
      <div className={styles.error}>Error: {error}</div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Fuel Station Locator</h1>
        <p className={styles.description}>
          Find alternative fuel stations across the United States
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.mapSection}>
          <MapView 
            onLoad={onLoad}
            filteredStations={filteredStations}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
          />
        </div>

        <div className={styles.sidebar}>
          <MapLegendPanel 
            filters={filters}
            toggleFilter={toggleFilter}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            ownershipFilter={ownershipFilter}
            setOwnershipFilter={setOwnershipFilter}
            stationCount={filteredStations.length}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
          />
        </div>
      </div>
    </div>
  );
}