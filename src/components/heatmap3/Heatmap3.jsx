'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './Heatmap3.module.css';

export default function Heatmap3() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const heatLayer = useRef(null);
  const markersLayer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [showMarkers, setShowMarkers] = useState(false);
  const [heatmapIntensity, setHeatmapIntensity] = useState(0.7);

  useEffect(() => {
    let L;
    let HeatmapOverlay;

    const initializeMap = async () => {
      try {
        // Dynamic import of Leaflet to avoid SSR issues
        if (typeof window !== 'undefined') {
          // Import Leaflet first
          const leafletModule = await import('leaflet');
          L = leafletModule.default;
          
          // Try to import leaflet.heat plugin
          try {
            await import('leaflet.heat');
          } catch (heatImportError) {
            console.warn('Failed to import leaflet.heat from npm, trying CDN fallback...');
            
            // Fallback: load from CDN
            const heatScript = document.createElement('script');
            heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
            heatScript.async = false;
            document.head.appendChild(heatScript);
            
            // Wait for script to load
            await new Promise((resolve, reject) => {
              heatScript.onload = resolve;
              heatScript.onerror = reject;
            });
          }
          
          // Import Leaflet CSS
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(leafletCSS);

          // Fix for default markers
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });
          
          // Verify heatLayer is available
          if (!L.heatLayer) {
            console.error('L.heatLayer is not available. Leaflet.heat plugin may not be loaded correctly.');
            throw new Error('Heatmap plugin not loaded');
          }
        }

        // Fetch vehicle data
        const response = await fetch('/api/vehicles-geojson3');
        if (!response.ok) {
          if (response.status === 503) {
            console.warn('Geocoding service temporarily unavailable - using cached data only');
          } else {
            throw new Error(`Failed to fetch vehicle data: ${response.statusText}`);
          }
        }
        const geojsonData = await response.json();
        setVehicleData(geojsonData);
        
        // Log data quality info
        const totalFeatures = geojsonData.features?.length || 0;
        console.log(`Loaded ${totalFeatures} vehicle locations for heatmap`);
        if (totalFeatures > 0 && totalFeatures < 1000) {
          console.info('Note: Some locations using approximate coordinates due to geocoding service limitations');
        }

        // Initialize map
        if (map.current) return;

        map.current = L.map(mapContainer.current, {
          center: [39.8, -98.5],
          zoom: 5,
          zoomControl: true,
          attributionControl: false
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map.current);

        // Prepare heatmap data
        const heatmapData = geojsonData.features.map(feature => {
          const coords = feature.geometry.coordinates;
          const props = feature.properties;
          
          // Calculate weight based on concentration type and vehicle count
          let baseWeight;
          switch (props.concentration_type) {
            case 0: baseWeight = 1.0; break; // Highly concentrated - highest weight
            case 1: baseWeight = 0.7; break; // Substantially concentrated - medium weight
            case 2: baseWeight = 0.3; break; // National - lowest weight
            default: baseWeight = 0.5;
          }
          
          const vehicleCount = props.vehicle_count || 1;
          const weight = baseWeight * Math.log(vehicleCount + 1) * heatmapIntensity;
          
          return [coords[1], coords[0], weight]; // [lat, lng, weight]
        });

        // Create heatmap layer with error handling
        try {
          if (!L.heatLayer) {
            throw new Error('L.heatLayer is not available');
          }
          
          heatLayer.current = L.heatLayer(heatmapData, {
            radius: 25,
            blur: 15,
            maxZoom: 12,
            minOpacity: 0.3,
            gradient: {
              0.0: 'rgba(0,0,255,0)',      // transparent
              0.2: 'rgba(0,0,255,0.7)',    // blue
              0.4: 'rgba(0,255,255,0.8)',  // cyan
              0.6: 'rgba(0,255,0,0.8)',    // green
              0.8: 'rgba(255,255,0,0.9)',  // yellow
              0.95: 'rgba(255,165,0,0.95)', // orange
            1.0: 'rgba(255,0,0,1)'       // red
          }
        }).addTo(map.current);
        
        console.log('Heatmap layer created successfully');
        
        } catch (heatError) {
          console.error('Failed to create heatmap layer:', heatError);
          // Fallback: just show markers without heatmap
          console.log('Falling back to markers-only view');
        }

        // Create markers layer group
        markersLayer.current = L.layerGroup();

        // Add markers for each location
        geojsonData.features.forEach(feature => {
          const coords = feature.geometry.coordinates;
          const props = feature.properties;
          
          // Color based on concentration type
          let markerColor;
          switch (props.concentration_type) {
            case 0: markerColor = '#EF4444'; break; // red - highly concentrated
            case 1: markerColor = '#F59E0B'; break; // orange - substantially concentrated
            case 2: markerColor = '#10B981'; break; // green - national
            default: markerColor = '#6B7280';
          }
          
          const marker = L.circleMarker([coords[1], coords[0]], {
            radius: Math.max(3, Math.min(15, Math.sqrt(props.vehicle_count || 1))),
            fillColor: markerColor,
            color: 'white',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.7
          });
          
          // Add popup
          marker.bindPopup(`
            <div style="font-family: system-ui; padding: 8px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">${props.city}, ${props.state}</h3>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Vehicle Count:</strong> ${props.vehicle_count}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Vehicle Class:</strong> ${props.vehicle_class}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Vehicle Type:</strong> ${props.vehicle_type}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Fuel Type:</strong> ${props.fuel_type}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>Concentration:</strong> ${props.concentration_description}</p>
            </div>
          `);
          
          markersLayer.current.addLayer(marker);
        });

        setLoading(false);

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        heatLayer.current = null;
        markersLayer.current = null;
      }
    };
  }, []);

  // Toggle markers
  const toggleMarkers = () => {
    if (!map.current || !markersLayer.current) return;
    
    if (showMarkers) {
      map.current.removeLayer(markersLayer.current);
    } else {
      map.current.addLayer(markersLayer.current);
    }
    setShowMarkers(!showMarkers);
  };

  // Update heatmap intensity
  const updateHeatmapIntensity = (newIntensity) => {
    setHeatmapIntensity(newIntensity);
    
    if (heatLayer.current && vehicleData) {
      // Recalculate heatmap data with new intensity
      const heatmapData = vehicleData.features.map(feature => {
        const coords = feature.geometry.coordinates;
        const props = feature.properties;
        
        let baseWeight;
        switch (props.concentration_type) {
          case 0: baseWeight = 1.0; break; // Highly concentrated - highest weight
          case 1: baseWeight = 0.7; break; // Substantially concentrated - medium weight
          case 2: baseWeight = 0.3; break; // National - lowest weight
          default: baseWeight = 0.5;
        }
        
        const vehicleCount = props.vehicle_count || 1;
        const weight = baseWeight * Math.log(vehicleCount + 1) * newIntensity;
        
        return [coords[1], coords[0], weight];
      });
      
      heatLayer.current.setLatLngs(heatmapData);
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Error Loading Heatmap</h2>
          <p>{error}</p>
          <div className={styles.instructions}>
            <p>This heatmap uses Leaflet.js with OpenStreetMap tiles - no API keys required!</p>
            <p>Make sure your CSV data is available at <code>public/vehicle_demo_data.csv</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Vehicle Concentration Heatmap (Leaflet)</h1>
        <p className={styles.description}>
          Interactive heatmap visualization using Leaflet.js and OpenStreetMap
        </p>
      </div>

      <div className={styles.content}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>Loading heatmap data...</p>
          </div>
        )}

        <div className={styles.mapContainer}>
          <div ref={mapContainer} className={styles.map} />

          {/* Control Panel */}
          <div className={styles.controlPanel}>
            <h3>Map Controls</h3>
            
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>
                <input
                  type="checkbox"
                  checked={showMarkers}
                  onChange={toggleMarkers}
                  className={styles.checkbox}
                />
                Show Location Markers
              </label>
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>
                Heatmap Intensity: {Math.round(heatmapIntensity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={heatmapIntensity}
                onChange={(e) => updateHeatmapIntensity(parseFloat(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <h3>Concentration Legend</h3>
            <div className={styles.legendItems}>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#EF4444' }}></div>
                <span>Highly Concentrated (0)</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#F59E0B' }}></div>
                <span>Substantially Concentrated (1)</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#10B981' }}></div>
                <span>National (2)</span>
              </div>
            </div>

            <div className={styles.heatmapLegend}>
              <h4>Heat Intensity</h4>
              <div className={styles.gradientBar}></div>
              <div className={styles.gradientLabels}>
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          {vehicleData && (
            <div className={styles.statsPanel}>
              <h3>Dataset Statistics</h3>
              <div className={styles.statItem}>
                <span>Total Locations:</span>
                <span>{vehicleData.features.length}</span>
              </div>
              <div className={styles.statItem}>
                <span>Total Vehicles:</span>
                <span>{vehicleData.features.reduce((sum, f) => sum + (f.properties.vehicle_count || 0), 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}