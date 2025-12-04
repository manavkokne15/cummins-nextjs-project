"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useCallback } from "react";
import MapLegendPanel from './MapLegendPanel';
import MapView from './MapView';

const libraries = ['places', 'visualization'];
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

  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [stationStatusFilter, setStationStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
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
  const getRegionMatch = (station, selectedRegion, selectedState) => {
    if (!station.state) return false;
    
    const stateCode = station.state.toUpperCase();
    
    // If specific state is selected, only match that state
    if (selectedState && selectedState !== 'all') {
      return stateCode === selectedState.toUpperCase();
    }
    
    // If no region selected, show all
    if (!selectedRegion || selectedRegion === 'all') return true;
    
    // US Regions mapping
    const regions = {
      new_england: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT'],
      mid_atlantic: ['NJ', 'NY', 'PA'],
      east_north_central: ['IL', 'IN', 'MI', 'OH', 'WI'],
      west_north_central: ['IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'],
      south_atlantic: ['DE', 'DC', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV'],
      east_south_central: ['AL', 'KY', 'MS', 'TN'],
      west_south_central: ['AR', 'LA', 'OK', 'TX'],
      mountain: ['AZ', 'CO', 'ID', 'MT', 'NV', 'NM', 'UT', 'WY'],
      pacific: ['AK', 'CA', 'HI', 'OR', 'WA']
    };

    return regions[selectedRegion]?.includes(stateCode) || false;
  };

  const filteredStations = stations.filter((s) => {
    // Fuel type filter
    const fuelKey = getFuelTypeKey(s.fuel_type);
    const fuelMatch = selectedFuelType === 'all' || fuelKey === selectedFuelType;
    
    // Station status filter
    const statusMatch = stationStatusFilter === 'all' || 
      (stationStatusFilter === 'available' && s.status_code === 'E') ||
      (stationStatusFilter === 'planned' && s.status_code === 'P');
    
    // Region and state filter
    const regionMatch = getRegionMatch(s, regionFilter, stateFilter);
    
    // Ownership filter
    const ownershipMatch = ownershipFilter === 'all' || 
      s.access_code?.toLowerCase() === ownershipFilter.toLowerCase();
    
    return fuelMatch && statusMatch && regionMatch && ownershipMatch;
  });

  // Removed auto-zoom functionality - map stays at default US center view
  // Stations are filtered but map doesn't zoom to specific regions

  const selectFuelType = (fuelType) => {
    setSelectedFuelType(fuelType);
    // When ELEC is selected, reset region to 'all' to show all states
    if (fuelType === 'elec') {
      setRegionFilter('all');
      setStateFilter('all');
    }
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
            selectedFuelType={selectedFuelType}
            selectFuelType={selectFuelType}
            stationStatusFilter={stationStatusFilter}
            setStationStatusFilter={setStationStatusFilter}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            stateFilter={stateFilter}
            setStateFilter={setStateFilter}
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