'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
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

const libraries = ['places'];

export default function HeatmapVisualization() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [regionFilter, setRegionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);

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
  const getRegionMatch = useCallback((state, selectedRegion) => {
    if (!selectedRegion || selectedRegion === 'all' || !state) return true;
    
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
    
    // US Regions mapping
    const regions = {
      northeast: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
      southeast: ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV', 'AL', 'KY', 'MS', 'TN', 'AR', 'LA'],
      midwest: ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'],
      southwest: ['AZ', 'NM', 'OK', 'TX'],
      west: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY']
    };
    
    const result = regions[selectedRegion]?.includes(stateCode) || false;
    return result;
  }, []);

  // Compute aggregated locations and heatmap data for deck.gl
  const { locations, maxVehicleCount, heatmapData } = useMemo(() => {
    if (vehicles.length === 0 || !isLoaded) {
      return { locations: [], maxVehicleCount: 1, heatmapData: [] };
    }

    // Filter vehicles by region first
    const filteredVehicles = vehicles.filter(vehicle => {
      const match = getRegionMatch(vehicle.state, regionFilter);
      return match;
    });

    const aggregated = aggregateByLocation(filteredVehicles);
    const max = Math.max(...aggregated.map(loc => loc.totalVehicles), 1);

    // For deck.gl, use plain objects: { location: { lat, lng }, weight }
    const data = selectedClass ? aggregated
      .filter(location => location.byClass[selectedClass] && location.byClass[selectedClass] > 0)
      .flatMap(location => {
        const count = location.byClass[selectedClass];
        const weight = getHeatmapIntensity(count, max);
        const pointCount = Math.max(1, Math.round(weight * 8));
        return Array(pointCount).fill(0).map(() => ({
          location: {
            lat: location.lat + (Math.random() - 0.5) * 0.1,
            lng: location.lng + (Math.random() - 0.5) * 0.1
          },
          weight: weight * 100,
        }));
      }) : [];

    return { locations: aggregated, maxVehicleCount: max, heatmapData: data };
  }, [vehicles, selectedClass, regionFilter, isLoaded, getRegionMatch]);

  // Handle class selection (single class only)
  const selectClass = useCallback((vehicleClass) => {
    setSelectedClass(vehicleClass);
  }, []);


  // Deck.gl overlay integration
  function DeckGlOverlay({ mapInstance, heatmapData, selectedClass, maxVehicleCount }) {
    // Stable overlay instance
    const deck = useMemo(() => new GoogleMapsOverlay({ layers: [] }), []);

    // Attach overlay to map
    useEffect(() => {
      if (mapInstance) {
        deck.setMap(mapInstance);
        return () => deck.setMap(null);
      }
    }, [mapInstance, deck]);

    // Update heatmap layer when data/class changes
    useEffect(() => {
      if (!mapInstance || !heatmapData || heatmapData.length === 0) {
        deck.setProps({ layers: [] });
        return;
      }

      // Map data for deck.gl: [{ position: [lng, lat], weight }]
      const deckData = heatmapData.map(d => ({
        position: [d.location.lng, d.location.lat],
        weight: d.weight
      }));

      const layer = new HeatmapLayer({
        id: 'deck-heatmap-layer',
        data: deckData,
        getPosition: d => d.position,
        getWeight: d => d.weight,
        radiusPixels: 100,
        intensity: 1,
        threshold: 0.01,
        colorRange: [
          [0, 255, 128, 0],      // Transparent green
          [0, 255, 0, 100],      // Light green
          [255, 255, 0, 150],    // Yellow
          [255, 200, 0, 200],    // Orange-yellow
          [255, 100, 0, 230],    // Orange
          [255, 0, 0, 255]       // Bright red
        ],
        aggregation: 'SUM'
      });
      deck.setProps({ layers: [layer] });
    }, [deck, heatmapData, selectedClass, maxVehicleCount, mapInstance]);

    return null;
  }

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
          >
            {mapInstance && heatmapData.length > 0 && (
              <DeckGlOverlay
                mapInstance={mapInstance}
                heatmapData={heatmapData}
                selectedClass={selectedClass}
                maxVehicleCount={maxVehicleCount}
              />
            )}
          </GoogleMap>
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
                  <span className={styles.colorDot} style={{ backgroundColor: getClassColor(vehicleClass) }}></span>
                  <span className={styles.labelText}>
                    Class {vehicleClass} - ({getVehicleTypeDescription(vehicleClass)})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Region Filter</h3>
            <div className={styles.filterOptions}>
              <select
                className={styles.regionSelect}
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <option value="all">All Regions</option>
                <option value="northeast">Northeast</option>
                <option value="southeast">Southeast</option>
                <option value="midwest">Midwest</option>
                <option value="southwest">Southwest</option>
                <option value="west">West</option>
              </select>
            </div>
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
    </div>
  );
}