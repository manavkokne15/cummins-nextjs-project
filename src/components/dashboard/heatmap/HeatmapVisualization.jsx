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
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
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
        setSelectedClasses(classes);
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute aggregated locations and heatmap data
  const { locations, maxVehicleCount, heatmapData } = useMemo(() => {
    if (vehicles.length === 0 || !isLoaded || !window.google) {
      return { locations: [], maxVehicleCount: 1, heatmapData: [] };
    }

    const aggregated = aggregateByLocation(vehicles);
    console.log('Aggregated locations:', aggregated.length, aggregated);
    
    const max = Math.max(...aggregated.map(loc => loc.totalVehicles), 1);
    console.log('Max vehicle count:', max);

    const data = aggregated
      .filter(location => {
        return selectedClasses.some(c => location.byClass[c] && location.byClass[c] > 0);
      })
      .flatMap(location => {
        return selectedClasses
          .filter(c => location.byClass[c] && location.byClass[c] > 0)
          .flatMap(vehicleClass => {
            const count = location.byClass[vehicleClass];
            const weight = getHeatmapIntensity(count, max);
            const pointCount = Math.max(1, Math.round(weight * 8));
            
            return Array(pointCount).fill(0).map(() => ({
              location: new window.google.maps.LatLng(
                location.lat + (Math.random() - 0.5) * 0.1,
                location.lng + (Math.random() - 0.5) * 0.1
              ),
              weight: weight * 100,
            }));
          });
      });

    console.log('Heatmap data points:', data.length, data.slice(0, 5));
    return { locations: aggregated, maxVehicleCount: max, heatmapData: data };
  }, [vehicles, selectedClasses, isLoaded]);

  // Handle class filter toggle
  const toggleClass = useCallback((vehicleClass) => {
    setSelectedClasses(prev => {
      return prev.includes(vehicleClass)
        ? prev.filter(c => c !== vehicleClass)
        : [...prev, vehicleClass];
    });
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

    // If no data or no selected classes, just remove the layer and return
    if (heatmapData.length === 0 || selectedClasses.length === 0) {
      console.log('No heatmap data or no selected classes, layer removed');
      return;
    }

    try {
      // Create new heatmap layer with proper format
      const heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstance,
        radius: 30,
        maxIntensity: 100,
        dissipating: true,
      });

      heatmapLayerRef.current = heatmapLayer;
      console.log('Heatmap layer created successfully');
    } catch (error) {
      console.error('Error creating heatmap layer:', error);
    }
  }, [mapInstance, isLoaded, heatmapData, selectedClasses]);

  // Fit map to bounds
  const onMapLoad = useCallback((map) => {
    setMapInstance(map);

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
                    type="checkbox"
                    checked={selectedClasses.includes(vehicleClass)}
                    onChange={() => toggleClass(vehicleClass)}
                    className={styles.checkbox}
                  />
                  <span className={styles.colorDot} style={{ backgroundColor: getClassColor(vehicleClass) }}></span>
                  <span className={styles.labelText}>
                    Class {vehicleClass} - ({getVehicleTypeDescription(vehicleClass)})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.statsSection}>
            <h3 className={styles.statsTitle}>Statistics</h3>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Locations:</span>
              <span className={styles.statValue}>{locations.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Active Classes:</span>
              <span className={styles.statValue}>{selectedClasses.length}</span>
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
