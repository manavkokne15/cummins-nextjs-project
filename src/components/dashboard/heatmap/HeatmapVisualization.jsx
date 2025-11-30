'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import {
  parseVehicleCSV,
  aggregateByLocation,
  getUniqueVehicleClasses,
  getUniqueRegions,
  getClassColor,
  getConcentrationColor,
  getConcentrationDescription,
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
  const [regions, setRegions] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
  const heatmapLayersRef = useRef({});

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  // Load CSV data once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting to load enhanced vehicle data...');
        const parsedVehicles = await parseVehicleCSV();
        console.log('Vehicles loaded:', parsedVehicles.length);
        setVehicles(parsedVehicles);
        
        const classes = getUniqueVehicleClasses(parsedVehicles);
        const regionList = getUniqueRegions(parsedVehicles);
        console.log('Vehicle classes found:', classes);
        console.log('Regions found:', regionList);
        
        setVehicleClasses(classes);
        setRegions(regionList);
        setSelectedClass(classes[0] || null); // Select first class by default
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute aggregated locations and heatmap data grouped by concentration type
  const { locations, maxVehicleCount, heatmapDataByConcentration } = useMemo(() => {
    if (vehicles.length === 0 || !isLoaded || !window.google || !selectedClass) {
      return { locations: [], maxVehicleCount: 1, heatmapDataByConcentration: {} };
    }

    const regionFilter = selectedRegion === 'All Regions' ? null : selectedRegion;
    const aggregated = aggregateByLocation(vehicles, selectedClass, regionFilter);
    console.log('Aggregated locations for class', selectedClass, ':', aggregated.length);
    
    const max = Math.max(...aggregated.map(loc => loc.totalVehicles), 1);
    console.log('Max vehicle count:', max);

    // Group data by concentration type for separate layers
    const dataByConcentration = {
      0: [], // Highly Concentrated - Red
      1: [], // Substantially Concentrated - Green  
      2: []  // National - Orange
    };

    aggregated
      .filter(location => {
        return location.byClass[selectedClass] && location.byClass[selectedClass] > 0;
      })
      .forEach(location => {
        const count = location.byClass[selectedClass];
        const concentrationType = location.concentrationByClass[selectedClass];
        
        let baseWeight = getHeatmapIntensity(count, max);
        
        // Ensure minimum visibility for each concentration type
        switch(concentrationType) {
          case 0: // Highly Concentrated
            baseWeight = Math.max(baseWeight, 0.9);
            break;
          case 1: // Substantially Concentrated
            baseWeight = Math.max(baseWeight, 0.7);
            break;
          case 2: // National
            baseWeight = Math.max(baseWeight, 0.5);
            break;
        }
        
        const pointCount = Math.max(3, Math.round(baseWeight * 10));
        
        const points = Array(pointCount).fill(0).map(() => ({
          location: new window.google.maps.LatLng(
            location.lat + (Math.random() - 0.5) * 0.04,
            location.lng + (Math.random() - 0.5) * 0.04
          ),
          weight: baseWeight * 100,
        }));
        
        if (dataByConcentration[concentrationType]) {
          dataByConcentration[concentrationType].push(...points);
        }
      });

    console.log('Heatmap data by concentration:', {
      'Highly Concentrated': dataByConcentration[0].length,
      'Substantially Concentrated': dataByConcentration[1].length,
      'National': dataByConcentration[2].length
    });
    
    return { locations: aggregated, maxVehicleCount: max, heatmapDataByConcentration: dataByConcentration };
  }, [vehicles, selectedClass, selectedRegion, isLoaded]);

  // Handle class selection (single selection)
  const handleClassChange = useCallback((vehicleClass) => {
    setSelectedClass(vehicleClass);
  }, []);
  
  // Handle region selection
  const handleRegionChange = useCallback((region) => {
    setSelectedRegion(region);
  }, []);

  // Update heatmap layers with blue background and concentration overlays
  useEffect(() => {
    if (!mapInstance || !isLoaded) {
      return;
    }

    // Remove all old heatmap layers
    Object.values(heatmapLayersRef.current).forEach(layer => {
      if (layer) layer.setMap(null);
    });
    heatmapLayersRef.current = {};

    if (!selectedClass) {
      console.log('No selected class, layers removed');
      return;
    }

    try {
      // Create blue background layer for areas with no vehicles
      const blueGradient = [
        'rgba(37, 99, 235, 0)',     // Transparent
        'rgba(37, 99, 235, 0.15)',  // Very light blue
        'rgba(59, 130, 246, 0.25)', // Light blue background
      ];

      // Create background coverage points across US
      const backgroundPoints = [];
      for (let lat = 25; lat <= 49; lat += 1) {
        for (let lng = -125; lng <= -66; lng += 1) {
          backgroundPoints.push({
            location: new window.google.maps.LatLng(lat, lng),
            weight: 1
          });
        }
      }

      const backgroundLayer = new window.google.maps.visualization.HeatmapLayer({
        data: backgroundPoints,
        map: mapInstance,
        radius: 100,
        maxIntensity: 1,
        dissipating: true,
        gradient: blueGradient,
        opacity: 0.3,
      });
      heatmapLayersRef.current['background'] = backgroundLayer;

      // Create specific concentration layers
      const concentrationConfigs = {
        0: { // Highly Concentrated - Red
          gradient: [
            'rgba(220, 38, 38, 0)',
            'rgba(220, 38, 38, 0.6)',
            'rgba(220, 38, 38, 0.9)',
            'rgba(185, 28, 28, 1)'
          ],
          radius: 35
        },
        1: { // Substantially Concentrated - Green
          gradient: [
            'rgba(5, 150, 105, 0)',
            'rgba(5, 150, 105, 0.6)',
            'rgba(5, 150, 105, 0.9)', 
            'rgba(4, 120, 87, 1)'
          ],
          radius: 30
        },
        2: { // National - Orange
          gradient: [
            'rgba(217, 119, 6, 0)',
            'rgba(217, 119, 6, 0.6)',
            'rgba(217, 119, 6, 0.9)',
            'rgba(180, 83, 9, 1)'
          ],
          radius: 25
        }
      };

      // Create layers for each concentration type
      Object.entries(heatmapDataByConcentration).forEach(([concentrationType, data]) => {
        if (data.length > 0) {
          const config = concentrationConfigs[concentrationType];
          
          const layer = new window.google.maps.visualization.HeatmapLayer({
            data: data,
            map: mapInstance,
            radius: config.radius,
            maxIntensity: 100,
            dissipating: true,
            gradient: config.gradient,
            opacity: 0.8,
          });
          
          heatmapLayersRef.current[`concentration_${concentrationType}`] = layer;
        }
      });

      console.log('Multi-layer heatmap created with blue background and concentration overlays');
    } catch (error) {
      console.error('Error creating heatmap layers:', error);
    }
  }, [mapInstance, isLoaded, heatmapDataByConcentration, selectedClass]);

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
        <h1 className={styles.title}>Vehicle Concentration Heatmap</h1>
        <p className={styles.description}>
          Regional concentration analysis of vehicle classes with intensity-based visualization
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
            <h3 className={styles.filterTitle}>Vehicle Class Selection</h3>
            <div className={styles.dropdown}>
              <select 
                value={selectedClass || ''} 
                onChange={(e) => handleClassChange(e.target.value)}
                className={styles.select}
              >
                <option value="">Select Vehicle Class</option>
                {vehicleClasses.map(vehicleClass => (
                  <option key={vehicleClass} value={vehicleClass}>
                    Class {vehicleClass} - {getVehicleTypeDescription(vehicleClass)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Region Filter</h3>
            <div className={styles.dropdown}>
              <select 
                value={selectedRegion} 
                onChange={(e) => handleRegionChange(e.target.value)}
                className={styles.select}
              >
                <option value="All Regions">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.legendSection}>
            <h3 className={styles.filterTitle}>Concentration Legend</h3>
            <div className={styles.concentrationLegend}>
              <div className={styles.legendItem}>
                <span className={styles.colorDot} style={{ backgroundColor: '#2563eb' }}></span>
                <span>Not Present</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.colorDot} style={{ backgroundColor: '#d97706' }}></span>
                <span>National Distribution</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.colorDot} style={{ backgroundColor: '#059669' }}></span>
                <span>Substantially Concentrated</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.colorDot} style={{ backgroundColor: '#dc2626' }}></span>
                <span>Highly Concentrated</span>
              </div>
            </div>
            <div className={styles.gradientBar}></div>
            <div className={styles.gradientLabels}>
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          <div className={styles.statsSection}>
            <h3 className={styles.statsTitle}>Statistics</h3>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Selected Class:</span>
              <span className={styles.statValue}>
                {selectedClass ? `Class ${selectedClass}` : 'None'}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Region:</span>
              <span className={styles.statValue}>{selectedRegion}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Locations:</span>
              <span className={styles.statValue}>{locations.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Heatmap Points:</span>
              <span className={styles.statValue}>
                {Object.values(heatmapDataByConcentration).reduce((sum, data) => sum + data.length, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
