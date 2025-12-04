/**
 * GeoJSON Data Generator for Vehicle Heatmap
 * 
 * This script generates a static GeoJSON file with pre-geocoded coordinates
 * to avoid real-time geocoding delays in the heatmap component.
 * 
 * Usage:
 *   node generate-geojson.js
 * 
 * Output:
 *   Creates/updates: public/vehicles-heatmap-data.geojson
 */

const fs = require('fs');
const path = require('path');

// Sample US cities with coordinates for instant loading
const sampleCities = [
  { city: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
  { city: 'San Antonio', state: 'TX', lat: 29.4241, lon: -98.4936 },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.8005 },
  { city: 'San Jose', state: 'CA', lat: 37.3382, lon: -121.8863 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
  { city: 'Jacksonville', state: 'FL', lat: 30.3322, lon: -81.6557 },
  { city: 'Fort Worth', state: 'TX', lat: 32.7555, lon: -97.3308 },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lon: -82.9988 },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
  { city: 'Indianapolis', state: 'IN', lat: 39.7684, lon: -86.1581 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
  { city: 'Washington', state: 'DC', lat: 38.9072, lon: -77.0369 },
  { city: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
  { city: 'El Paso', state: 'TX', lat: 31.7619, lon: -106.4850 },
  { city: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lon: -86.7816 },
  { city: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
  { city: 'Memphis', state: 'TN', lat: 35.1495, lon: -90.0490 },
  { city: 'Oklahoma City', state: 'OK', lat: 35.4676, lon: -97.5164 },
  { city: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398 },
  { city: 'Louisville', state: 'KY', lat: 38.2027, lon: -85.7585 },
  { city: 'Baltimore', state: 'MD', lat: 39.2904, lon: -76.6122 }
];

// Vehicle types and classes
const vehicleTypes = [
  'Light-duty truck', 'Medium-duty truck', 'Heavy-duty truck', 
  'Transit bus', 'School bus', 'Delivery van'
];

const vehicleClasses = [2, 3, 4, 5, 6, 7, 8];

const fuelTypes = ['Diesel', 'Gasoline', 'Electric', 'Hybrid', 'Natural Gas'];

const concentrationTypes = [
  { type: 0, description: 'Highly concentrated' },
  { type: 1, description: 'Substantially concentrated' },
  { type: 2, description: 'National' }
];

// Generate random data for each city
function generateVehicleData() {
  const features = [];
  
  sampleCities.forEach((city, index) => {
    // Generate 1-3 records per city for variety
    const recordsPerCity = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < recordsPerCity; i++) {
      const concentrationType = concentrationTypes[Math.floor(Math.random() * concentrationTypes.length)];
      
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            city.lon + (Math.random() - 0.5) * 0.1, // Add small random offset
            city.lat + (Math.random() - 0.5) * 0.1
          ]
        },
        properties: {
          city: city.city,
          state: city.state,
          vehicle_count: Math.floor(Math.random() * 25) + 5, // 5-30 vehicles
          vehicle_class: vehicleClasses[Math.floor(Math.random() * vehicleClasses.length)],
          vehicle_type: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
          fuel_type: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
          concentration_type: concentrationType.type,
          concentration_description: concentrationType.description
        }
      };
      
      features.push(feature);
    }
  });
  
  return features;
}

// Generate the GeoJSON data
function generateGeoJSON() {
  const features = generateVehicleData();
  
  // Count by concentration type
  const distribution = { 0: 0, 1: 0, 2: 0 };
  features.forEach(feature => {
    distribution[feature.properties.concentration_type]++;
  });
  
  const geojson = {
    type: 'FeatureCollection',
    features: features,
    metadata: {
      total_records: features.length,
      processed: features.length,
      failed: 0,
      concentration_distribution: {
        'Highly Concentrated (0)': distribution[0],
        'Substantially Concentrated (1)': distribution[1],
        'National (2)': distribution[2]
      },
      generated_at: new Date().toISOString(),
      note: 'Pre-generated static GeoJSON for instant loading'
    }
  };
  
  return geojson;
}

// Save to file
function saveGeoJSON() {
  const geojson = generateGeoJSON();
  const outputPath = path.join(__dirname, '..', 'public', 'vehicles-heatmap-data.geojson');
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
    console.log(`✅ Generated GeoJSON with ${geojson.features.length} locations`);
    console.log(`📍 Saved to: ${outputPath}`);
    console.log('📊 Distribution:');
    console.log(`   - Highly Concentrated: ${geojson.metadata.concentration_distribution['Highly Concentrated (0)']}`);
    console.log(`   - Substantially Concentrated: ${geojson.metadata.concentration_distribution['Substantially Concentrated (1)']}`);
    console.log(`   - National: ${geojson.metadata.concentration_distribution['National (2)']}`);
    console.log('\n🚀 Your heatmap will now load instantly!');
  } catch (error) {
    console.error('❌ Error saving GeoJSON:', error.message);
  }
}

// Run the generator
if (require.main === module) {
  console.log('🔧 Generating static GeoJSON data for instant heatmap loading...\n');
  saveGeoJSON();
}

module.exports = { generateGeoJSON, sampleCities };