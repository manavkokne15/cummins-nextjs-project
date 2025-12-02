'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './Heatmap2.module.css';

export default function Heatmap2() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(-98.5);
  const [lat] = useState(39.8);
  const [zoom] = useState(4);
  const [loading, setLoading] = useState(true);
  const [vehicleData, setVehicleData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load Mapbox GL JS dynamically
    const loadMapbox = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Load Mapbox GL JS and CSS
        if (!window.mapboxgl) {
          const mapboxgl = await import('mapbox-gl');
          window.mapboxgl = mapboxgl.default;
          
          // Load CSS
          const link = document.createElement('link');
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }

        // Check for access token
        if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
          throw new Error('Mapbox access token not found. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file');
        }

        window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

        // Fetch vehicle data
        const response = await fetch('/api/vehicles-geojson2');
        if (!response.ok) {
          throw new Error(`Failed to fetch vehicle data: ${response.statusText}`);
        }
        const geojsonData = await response.json();
        setVehicleData(geojsonData);

        // Initialize map
        if (map.current) return; // Initialize map only once

        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [lng, lat],
          zoom: zoom,
          attributionControl: false
        });

        map.current.on('load', () => {
          // Add vehicle data source
          map.current.addSource('vehicles', {
            type: 'geojson',
            data: geojsonData
          });

          // Add heatmap layer
          map.current.addLayer({
            id: 'vehicles-heatmap',
            type: 'heatmap',
            source: 'vehicles',
            maxzoom: 15,
            paint: {
              // Increase the heatmap weight based on concentration type and vehicle count
              'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'concentration_weight'],
                0, 0.1,
                0.3, 0.3,
                0.7, 0.7,
                1, 1.0
              ],
              // Increase the heatmap color weight weight by zoom level
              // heatmap-intensity is a multiplier on top of heatmap-weight
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                15, 3
              ],
              // Color ramp for heatmap - transparent to red
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0,0,255,0)',      // transparent
                0.1, 'rgba(0,0,255,0.4)',  // blue
                0.3, 'rgba(0,150,255,0.6)', // light blue
                0.5, 'rgba(255,255,0,0.8)', // yellow
                0.7, 'rgba(255,165,0,0.9)', // orange
                1, 'rgba(255,0,0,1)'        // red
              ],
              // Adjust the heatmap radius by zoom level
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 5,
                12, 40
              ],
              // Transition from heatmap to circle layer by zoom level
              'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7, 1,
                15, 0
              ]
            }
          }, 'waterway-label');

          // Add circle layer for individual points at higher zoom levels
          map.current.addLayer({
            id: 'vehicle-points',
            type: 'circle',
            source: 'vehicles',
            minzoom: 7,
            paint: {
              // Size circle radius by concentration type and vehicle count
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7, ['interpolate', ['linear'], ['get', 'concentration_weight'], 0, 1, 1, 4],
                16, ['interpolate', ['linear'], ['get', 'concentration_weight'], 0, 5, 1, 20]
              ],
              // Color circle by concentration type
              'circle-color': [
                'case',
                ['==', ['get', 'concentration_type'], 0], '#3B82F6', // blue for national
                ['==', ['get', 'concentration_type'], 1], '#10B981', // green for national
                ['==', ['get', 'concentration_type'], 2], '#F59E0B', // orange for substantially concentrated
                ['==', ['get', 'concentration_type'], 3], '#EF4444', // red for highly concentrated
                '#6B7280' // gray as fallback
              ],
              'circle-stroke-color': 'white',
              'circle-stroke-width': 1,
              // Transition from transparent to visible based on zoom
              'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7, 0,
                15, 1
              ]
            }
          }, 'waterway-label');

          // Add popup on click
          map.current.on('click', 'vehicle-points', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const props = e.features[0].properties;
            
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new window.mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(
                `<div style="padding: 8px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937;">${props.city}, ${props.state}</h3>
                  <p style="margin: 4px 0;"><strong>Vehicle Count:</strong> ${props.vehicle_count}</p>
                  <p style="margin: 4px 0;"><strong>Vehicle Class:</strong> ${props.vehicle_class}</p>
                  <p style="margin: 4px 0;"><strong>Vehicle Type:</strong> ${props.vehicle_type}</p>
                  <p style="margin: 4px 0;"><strong>Fuel Type:</strong> ${props.fuel_type}</p>
                  <p style="margin: 4px 0;"><strong>Concentration:</strong> ${props.concentration_description}</p>
                </div>`
              )
              .addTo(map.current);
          });

          // Change the cursor to a pointer when the mouse is over the points layer
          map.current.on('mouseenter', 'vehicle-points', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          // Change it back to a pointer when it leaves
          map.current.on('mouseleave', 'vehicle-points', () => {
            map.current.getCanvas().style.cursor = '';
          });

          setLoading(false);
        });

        // Add navigation control
        map.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

        // Add fullscreen control
        map.current.addControl(new window.mapboxgl.FullscreenControl(), 'top-right');

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadMapbox();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Error Loading Heatmap</h2>
          <p>{error}</p>
          <div className={styles.envInstructions}>
            <h3>Setup Instructions:</h3>
            <ol>
              <li>Create a <code>.env.local</code> file in your project root</li>
              <li>Add your Mapbox access token:</li>
              <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=YOUR_TOKEN_HERE</code>
              <li>Get a free token at <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer">mapbox.com</a></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Loading heatmap...</p>
        </div>
      )}
      
      <div className={styles.mapContainer}>
        <div ref={mapContainer} className={styles.map} />
        
        {/* Legend */}
        <div className={styles.legend}>
          <h3>Vehicle Concentration</h3>
          <div className={styles.legendItems}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#3B82F6' }}></div>
              <span>National (Low)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#10B981' }}></div>
              <span>National (Medium)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#F59E0B' }}></div>
              <span>Substantially Concentrated</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#EF4444' }}></div>
              <span>Highly Concentrated</span>
            </div>
          </div>
          
          {/* Heatmap intensity legend */}
          <div className={styles.heatmapLegend}>
            <h4>Intensity Scale</h4>
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
  );
}