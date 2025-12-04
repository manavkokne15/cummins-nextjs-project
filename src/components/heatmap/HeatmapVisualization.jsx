'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import {
  parseVehicleCSV,
  aggregateByLocation,
  getUniqueVehicleClasses,
  getClassColor,
  getVehicleTypeDescription,
  getHeatmapIntensity,
} from '@/utils/csvParser';
import styles from './HeatmapVisualization.module.css';

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: 39.5,
  lng: -98.35,
};

const libraries = ['places', 'visualization'];

export default function HeatmapVisualization() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [regionFilter, setRegionFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [selectedFuel, setSelectedFuel] = useState('CNG');
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const heatmapLayerRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  // Load CSV data once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting to load vehicle data...');
        const parsedVehicles = await parseVehicleCSV();
        console.log('Vehicles loaded:', parsedVehicles.length);
        setVehicles(parsedVehicles);
        
        const classes = getUniqueVehicleClasses(parsedVehicles);
        console.log('Vehicle classes found:', classes);
        setVehicleClasses(classes);
        setSelectedClass(classes[0] || null);
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Region mapping for US states
  const getRegionMatch = useCallback((state, selectedRegion, selectedState) => {
    if (!state) return false;
    
    // Convert full state name to state code
    const stateNameToCode = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
      'District of Columbia': 'DC'
    };
    
    const stateName = state.trim();
    const stateCode = stateNameToCode[stateName] || stateName.toUpperCase();
    
    // If specific state is selected, only match that state
    if (selectedState && selectedState !== 'all') {
      return stateCode === selectedState.toUpperCase();
    }
    
    // If no region selected, show all
    if (!selectedRegion || selectedRegion === 'all') return true;
    
    // US Regions mapping (Census divisions per provided image)
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

    const result = regions[selectedRegion]?.includes(stateCode) || false;
    return result;
  }, []);

  // Compute aggregated locations and heatmap data
  const { locations, maxVehicleCount, heatmapData } = useMemo(() => {
    if (vehicles.length === 0 || !isLoaded || !window.google) {
      return { locations: [], maxVehicleCount: 1, heatmapData: [] };
    }

    // Filter vehicles by region, state, and fuel type
    const filteredVehicles = vehicles.filter(vehicle => {
      const regionMatch = getRegionMatch(vehicle.state, regionFilter, stateFilter);
      const fuelMatch = vehicle.fuelType === selectedFuel;
      return regionMatch && fuelMatch;
    });

    console.log(`Region filter: ${regionFilter}, Total vehicles: ${vehicles.length}, Filtered: ${filteredVehicles.length}`);
    
    const aggregated = aggregateByLocation(filteredVehicles);
    console.log('Aggregated locations:', aggregated.length, aggregated.slice(0, 3));
    
    const max = Math.max(...aggregated.map(loc => loc.totalVehicles), 1);
    console.log('Max vehicle count:', max);

    const data = selectedClass ? aggregated
      .filter(location => {
        return location.byClass[selectedClass] && location.byClass[selectedClass] > 0;
      })
      .flatMap(location => {
        const count = location.byClass[selectedClass];
        const weight = getHeatmapIntensity(count, max);
        const pointCount = Math.max(1, Math.round(weight * 8));
        
        return Array(pointCount).fill(0).map(() => ({
          location: new window.google.maps.LatLng(
            location.lat + (Math.random() - 0.5) * 0.1,
            location.lng + (Math.random() - 0.5) * 0.1
          ),
          weight: weight * 100,
        }));
      }) : [];

    console.log('Heatmap data points:', data.length, data.slice(0, 5));
    return { locations: aggregated, maxVehicleCount: max, heatmapData: data };
  }, [vehicles, selectedClass, regionFilter, stateFilter, selectedFuel, isLoaded, getRegionMatch]);

  // Handle class selection (single class only)
  const selectClass = useCallback((vehicleClass) => {
    setSelectedClass(vehicleClass);
  }, []);

  // Handle fuel type selection (single fuel only)
  const selectFuel = useCallback((fuelType) => {
    setSelectedFuel(fuelType);
    // When EV is selected, reset region to 'all' to show all states
    if (fuelType === 'EV') {
      setRegionFilter('all');
      setStateFilter('all');
    }
  }, []);

  // Update heatmap layer
  useEffect(() => {
    if (!mapInstance || !isLoaded) {
      return;
    }

    // Remove old heatmap layer
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null);
      heatmapLayerRef.current = null;
    }

    // If no data or no selected class, just remove the layer and return
    if (heatmapData.length === 0 || !selectedClass) {
      console.log('No heatmap data or no selected class, layer removed');
      return;
    }

    try {
      // Create new heatmap layer with proper format
      const heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstance,
        radius: 100,
        maxIntensity: 100,
        dissipating: true ,
      });

      heatmapLayerRef.current = heatmapLayer;
      console.log('Heatmap layer created successfully');
    } catch (error) {
      console.error('Error creating heatmap layer:', error);
    }
  }, [mapInstance, isLoaded, heatmapData, selectedClass]);

  // Fit map to bounds on initial load only
  const onMapLoad = useCallback((map) => {
    setMapInstance(map);
    
    // Only fit bounds on initial load
    if (locations.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach(loc => {
        bounds.extend({ lat: loc.lat, lng: loc.lng });
      });
      map.fitBounds(bounds);
    }
  }, [locations]);

  if (!isLoaded) {
    return <div className={styles.loading}>Loading Google Maps...</div>;
  }

  if (loading) {
    return <div className={styles.loading}>Loading vehicle data...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Vehicle Distribution Heatmap</h1>
        <p className={styles.description}>
          Geographic distribution of vehicles by class type across the United States
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.mapSection}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={4}
            onLoad={onMapLoad}
            options={{
              gestureHandling: 'cooperative',
              zoomControl: true,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          />
        </div>

        <div className={styles.sidebar}>
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Vehicle Class Filters</h3>
            <div className={styles.filterOptions}>
              {vehicleClasses.map(vehicleClass => (
                <label key={vehicleClass} className={styles.filterLabel}>
                  <input
                    type="radio"
                    name="vehicleClass"
                    checked={selectedClass === vehicleClass}
                    onChange={() => selectClass(vehicleClass)}
                    className={styles.radio}
                  />
                  <span className={styles.labelText}>
                    {vehicleClass === '6' ? 'Medium Duty' : vehicleClass === '7' ? 'Heavy Duty' : 'Bus'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filterTriggerSection}>
            <button 
              className={styles.filterTriggerButton}
              onClick={() => setIsFilterOpen(true)}
            >
              <span>🔍</span>
              <span>Filter Options</span>
            </button>
          </div>

          <div className={styles.statsSection}>
            <h3 className={styles.statsTitle}>Statistics</h3>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Locations:</span>
              <span className={styles.statValue}>{locations.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Selected Class:</span>
              <span className={styles.statValue}>{selectedClass || 'None'}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Heatmap Points:</span>
              <span className={styles.statValue}>{heatmapData.length}</span>
            </div>
            <div className={styles.legend}>
              <p className={styles.legendTitle}>Intensity Legend:</p>
              <div className={styles.legendBar}></div>
              <div className={styles.legendLabels}>
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Slide Panel */}
      {isFilterOpen && (
        <div className={styles.filterOverlay} onClick={() => setIsFilterOpen(false)}>
          <div 
            className={`${styles.filterSlidePanel} ${isFilterOpen ? styles.open : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.filterPanelHeader}>
              <h3 className={styles.filterPanelTitle}>Filters</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsFilterOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.filterPanelContent}>
              {/* Region Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Region</h4>
                <div className={styles.filterItems}>
                  <select
                    className={styles.filterSelect}
                    value={regionFilter}
                    onChange={(e) => {
                      setRegionFilter(e.target.value);
                      setStateFilter('all'); // Reset state when region changes
                    }}
                    disabled={selectedFuel === 'EV'}
                  >
                    <option value="all">All Regions</option>
                    <option value="new_england">New England</option>
                    <option value="mid_atlantic">Mid-Atlantic</option>
                    <option value="east_north_central">East North Central</option>
                    <option value="west_north_central">West North Central</option>
                    <option value="south_atlantic">South Atlantic</option>
                    <option value="east_south_central">East South Central</option>
                    <option value="west_south_central">West South Central</option>
                    <option value="mountain">Mountain</option>
                    <option value="pacific">Pacific</option>
                  </select>
                </div>
              </div>

              {/* State Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>State</h4>
                <div className={styles.filterItems}>
                  <select
                    className={styles.filterSelect}
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    disabled={selectedFuel === 'CNG' && regionFilter === 'all'}
                  >
                    <option value="all">{selectedFuel === 'EV' ? 'All States' : (regionFilter === 'all' ? 'Select a region first' : 'All States in Region')}</option>
                    {selectedFuel === 'EV' && (
                      <>
                        <option value="AL">Alabama</option>
                        <option value="AK">Alaska</option>
                        <option value="AZ">Arizona</option>
                        <option value="AR">Arkansas</option>
                        <option value="CA">California</option>
                        <option value="CO">Colorado</option>
                        <option value="CT">Connecticut</option>
                        <option value="DE">Delaware</option>
                        <option value="DC">District of Columbia</option>
                        <option value="FL">Florida</option>
                        <option value="GA">Georgia</option>
                        <option value="HI">Hawaii</option>
                        <option value="ID">Idaho</option>
                        <option value="IL">Illinois</option>
                        <option value="IN">Indiana</option>
                        <option value="IA">Iowa</option>
                        <option value="KS">Kansas</option>
                        <option value="KY">Kentucky</option>
                        <option value="LA">Louisiana</option>
                        <option value="ME">Maine</option>
                        <option value="MD">Maryland</option>
                        <option value="MA">Massachusetts</option>
                        <option value="MI">Michigan</option>
                        <option value="MN">Minnesota</option>
                        <option value="MS">Mississippi</option>
                        <option value="MO">Missouri</option>
                        <option value="MT">Montana</option>
                        <option value="NE">Nebraska</option>
                        <option value="NV">Nevada</option>
                        <option value="NH">New Hampshire</option>
                        <option value="NJ">New Jersey</option>
                        <option value="NM">New Mexico</option>
                        <option value="NY">New York</option>
                        <option value="NC">North Carolina</option>
                        <option value="ND">North Dakota</option>
                        <option value="OH">Ohio</option>
                        <option value="OK">Oklahoma</option>
                        <option value="OR">Oregon</option>
                        <option value="PA">Pennsylvania</option>
                        <option value="RI">Rhode Island</option>
                        <option value="SC">South Carolina</option>
                        <option value="SD">South Dakota</option>
                        <option value="TN">Tennessee</option>
                        <option value="TX">Texas</option>
                        <option value="UT">Utah</option>
                        <option value="VT">Vermont</option>
                        <option value="VA">Virginia</option>
                        <option value="WA">Washington</option>
                        <option value="WV">West Virginia</option>
                        <option value="WI">Wisconsin</option>
                        <option value="WY">Wyoming</option>
                      </>
                    )}
                    {regionFilter === 'new_england' && (
                      <>
                        <option value="CT">Connecticut</option>
                        <option value="ME">Maine</option>
                        <option value="MA">Massachusetts</option>
                        <option value="NH">New Hampshire</option>
                        <option value="RI">Rhode Island</option>
                        <option value="VT">Vermont</option>
                      </>
                    )}
                    {regionFilter === 'mid_atlantic' && (
                      <>
                        <option value="NJ">New Jersey</option>
                        <option value="NY">New York</option>
                        <option value="PA">Pennsylvania</option>
                      </>
                    )}
                    {regionFilter === 'east_north_central' && (
                      <>
                        <option value="IL">Illinois</option>
                        <option value="IN">Indiana</option>
                        <option value="MI">Michigan</option>
                        <option value="OH">Ohio</option>
                        <option value="WI">Wisconsin</option>
                      </>
                    )}
                    {regionFilter === 'west_north_central' && (
                      <>
                        <option value="IA">Iowa</option>
                        <option value="KS">Kansas</option>
                        <option value="MN">Minnesota</option>
                        <option value="MO">Missouri</option>
                        <option value="NE">Nebraska</option>
                        <option value="ND">North Dakota</option>
                        <option value="SD">South Dakota</option>
                      </>
                    )}
                    {regionFilter === 'south_atlantic' && (
                      <>
                        <option value="DE">Delaware</option>
                        <option value="DC">District of Columbia</option>
                        <option value="FL">Florida</option>
                        <option value="GA">Georgia</option>
                        <option value="MD">Maryland</option>
                        <option value="NC">North Carolina</option>
                        <option value="SC">South Carolina</option>
                        <option value="VA">Virginia</option>
                        <option value="WV">West Virginia</option>
                      </>
                    )}
                    {regionFilter === 'east_south_central' && (
                      <>
                        <option value="AL">Alabama</option>
                        <option value="KY">Kentucky</option>
                        <option value="MS">Mississippi</option>
                        <option value="TN">Tennessee</option>
                      </>
                    )}
                    {regionFilter === 'west_south_central' && (
                      <>
                        <option value="AR">Arkansas</option>
                        <option value="LA">Louisiana</option>
                        <option value="OK">Oklahoma</option>
                        <option value="TX">Texas</option>
                      </>
                    )}
                    {regionFilter === 'mountain' && (
                      <>
                        <option value="AZ">Arizona</option>
                        <option value="CO">Colorado</option>
                        <option value="ID">Idaho</option>
                        <option value="MT">Montana</option>
                        <option value="NV">Nevada</option>
                        <option value="NM">New Mexico</option>
                        <option value="UT">Utah</option>
                        <option value="WY">Wyoming</option>
                      </>
                    )}
                    {regionFilter === 'pacific' && (
                      <>
                        <option value="AK">Alaska</option>
                        <option value="CA">California</option>
                        <option value="HI">Hawaii</option>
                        <option value="OR">Oregon</option>
                        <option value="WA">Washington</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Fuel Type Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Fuel Type</h4>
                <div className={styles.filterItems}>
                  <label className={styles.panelFilterLabel}>
                    <input
                      type="radio"
                      name="fuelType"
                      className={styles.filterRadio}
                      checked={selectedFuel === 'CNG'}
                      onChange={() => selectFuel('CNG')}
                    />
                    <span>CNG (Compressed Natural Gas)</span>
                  </label>
                  <label className={styles.panelFilterLabel}>
                    <input
                      type="radio"
                      name="fuelType"
                      className={styles.filterRadio}
                      checked={selectedFuel === 'EV'}
                      onChange={() => selectFuel('EV')}
                    />
                    <span>EV (Electric Vehicle)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
