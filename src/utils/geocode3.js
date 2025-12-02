import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'src', 'utils', 'geocache3.json');
const DELAY_BETWEEN_REQUESTS = 8000; // 8 second delay between API calls to avoid 403 errors

// Load existing cache
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(cacheData);
    }
  } catch (error) {
    console.warn('Error loading geocache3:', error.message);
  }
  return {};
}

// Save cache to file
function saveCache(cache) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`Saved ${Object.keys(cache).length} entries to geocache3`);
  } catch (error) {
    console.error('Error saving geocache3:', error.message);
  }
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fallback coordinates for common US cities to reduce API dependency
const CITY_FALLBACKS = {
  'hilton head island, south carolina': { lat: 32.2163, lon: -80.7526 },
  "o'fallon, missouri": { lat: 38.8106, lon: -90.7001 },
  'beulah, north dakota': { lat: 47.2625, lon: -101.7782 },
  'edmonds, washington': { lat: 47.8107, lon: -122.3774 },
  'dickinson, north dakota': { lat: 46.8783, lon: -102.7895 },
  'south kingstown, rhode island': { lat: 41.4732, lon: -71.5226 },
  'dagsboro, delaware': { lat: 38.5493, lon: -75.2477 },
  'miramar, florida': { lat: 25.9860, lon: -80.2320 },
  'springfield, illinois': { lat: 39.7817, lon: -89.6501 },
  'rochester, new york': { lat: 43.1566, lon: -77.6088 },
  'cleveland, ohio': { lat: 41.4993, lon: -81.6944 },
  'athens, georgia': { lat: 33.9519, lon: -83.3576 }
};

// Geocode using OpenStreetMap Nominatim API with enhanced error handling
async function geocodeWithNominatim(city, state) {
  // Check fallback first to reduce API calls
  const fallbackKey = `${city.toLowerCase()}, ${state.toLowerCase()}`;
  if (CITY_FALLBACKS[fallbackKey]) {
    console.log(`✓ Using fallback coordinates for ${city}, ${state}`);
    return CITY_FALLBACKS[fallbackKey];
  }

  const queries = [
    `${city}, ${state}, USA`,
    `${city} ${state}`
  ];
  
  for (let i = 0; i < queries.length; i++) {
    const query = encodeURIComponent(queries[i]);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=us`;
    
    try {
      console.log(`Geocoding: ${queries[i]}`);
      
      // Add longer delay to avoid rate limiting
      await sleep(2500);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Vehicle-Heatmap-App/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.warn(`Rate limited (403) - using fallback strategy`);
          break; // Exit and use fallback
        }
        console.warn(`HTTP ${response.status} for query: ${queries[i]}`);
        continue;
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const coordinates = {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon)
        };
        
        console.log(`✓ Geocoded ${city}, ${state} → ${coordinates.lat}, ${coordinates.lon}`);
        return coordinates;
      }
      
    } catch (error) {
      console.warn(`Geocoding failed for ${queries[i]}:`, error.message);
    }
  }
  
  // If all geocoding attempts failed, try to generate approximate coordinates
  // based on state center + some randomization
  return getApproximateStateCoordinates(state);
}

// Generate approximate coordinates based on state
function getApproximateStateCoordinates(state) {
  const stateCoords = {
    'alabama': { lat: 32.7, lon: -86.8 },
    'alaska': { lat: 64.0, lon: -153.0 },
    'arizona': { lat: 34.0, lon: -111.0 },
    'arkansas': { lat: 35.0, lon: -92.0 },
    'california': { lat: 36.8, lon: -119.4 },
    'colorado': { lat: 39.0, lon: -105.5 },
    'connecticut': { lat: 41.6, lon: -72.7 },
    'delaware': { lat: 38.9, lon: -75.5 },
    'florida': { lat: 27.8, lon: -81.7 },
    'georgia': { lat: 33.0, lon: -83.5 },
    'hawaii': { lat: 21.1, lon: -157.5 },
    'idaho': { lat: 44.2, lon: -114.5 },
    'illinois': { lat: 40.3, lon: -89.0 },
    'indiana': { lat: 39.8, lon: -86.3 },
    'iowa': { lat: 42.0, lon: -93.2 },
    'kansas': { lat: 38.5, lon: -96.7 },
    'kentucky': { lat: 37.7, lon: -84.9 },
    'louisiana': { lat: 31.0, lon: -91.8 },
    'maine': { lat: 44.3, lon: -69.8 },
    'maryland': { lat: 39.0, lon: -76.8 },
    'massachusetts': { lat: 42.2, lon: -71.5 },
    'michigan': { lat: 43.3, lon: -84.5 },
    'minnesota': { lat: 45.7, lon: -93.9 },
    'mississippi': { lat: 32.7, lon: -89.7 },
    'missouri': { lat: 38.4, lon: -92.2 },
    'montana': { lat: 47.0, lon: -110.0 },
    'nebraska': { lat: 41.1, lon: -98.0 },
    'nevada': { lat: 38.3, lon: -117.0 },
    'new hampshire': { lat: 43.4, lon: -71.5 },
    'new jersey': { lat: 40.3, lon: -74.5 },
    'new mexico': { lat: 34.8, lon: -106.2 },
    'new york': { lat: 42.2, lon: -74.9 },
    'north carolina': { lat: 35.6, lon: -79.8 },
    'north dakota': { lat: 47.5, lon: -99.8 },
    'ohio': { lat: 40.3, lon: -82.8 },
    'oklahoma': { lat: 35.6, lon: -96.9 },
    'oregon': { lat: 44.6, lon: -122.1 },
    'pennsylvania': { lat: 40.5, lon: -77.2 },
    'rhode island': { lat: 41.7, lon: -71.5 },
    'south carolina': { lat: 33.8, lon: -80.9 },
    'south dakota': { lat: 44.3, lon: -99.4 },
    'tennessee': { lat: 35.7, lon: -86.0 },
    'texas': { lat: 31.1, lon: -97.6 },
    'utah': { lat: 40.2, lon: -111.5 },
    'vermont': { lat: 44.0, lon: -72.7 },
    'virginia': { lat: 37.8, lon: -78.2 },
    'washington': { lat: 47.4, lon: -121.5 },
    'west virginia': { lat: 38.5, lon: -80.9 },
    'wisconsin': { lat: 44.3, lon: -89.6 },
    'wyoming': { lat: 42.8, lon: -107.3 }
  };

  const stateKey = state.toLowerCase();
  if (stateCoords[stateKey]) {
    // Add some random offset to avoid all points being in exact same location
    const baseCoords = stateCoords[stateKey];
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * 2, // ±1 degree variation
      lon: baseCoords.lon + (Math.random() - 0.5) * 2
    };
  }

  // Default to center of US if state not found
  console.warn(`Unknown state: ${state}, using US center`);
  return {
    lat: 39.8 + (Math.random() - 0.5) * 10,
    lon: -98.5 + (Math.random() - 0.5) * 20
  };
}

// Main geocoding function with caching and enhanced logic
export async function geocodeCity(city, state) {
  if (!city || !state) {
    console.warn('Missing city or state for geocoding');
    return getApproximateStateCoordinates(state || 'unknown');
  }

  const cache = loadCache();
  const cacheKey = `${city.toLowerCase().trim()}, ${state.toLowerCase().trim()}`;
  
  // Check cache first
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }
  
  // Rate limiting - wait between requests
  await sleep(DELAY_BETWEEN_REQUESTS);
  
  // Geocode using Nominatim with fallback strategy
  const coordinates = await geocodeWithNominatim(city, state);
  
  if (coordinates) {
    // Validate coordinates are within reasonable US bounds
    if (coordinates.lat >= 20 && coordinates.lat <= 71 && 
        coordinates.lon >= -180 && coordinates.lon <= -60) {
      
      // Save to cache
      cache[cacheKey] = coordinates;
      saveCache(cache);
      
      return coordinates;
    } else {
      console.warn(`Coordinates outside US bounds for ${city}, ${state}: ${coordinates.lat}, ${coordinates.lon}`);
    }
  }
  
  // Use approximate coordinates instead of returning null
  const approxCoords = getApproximateStateCoordinates(state);
  cache[cacheKey] = approxCoords;
  saveCache(cache);
  
  return approxCoords;
}

// Batch geocode function for processing multiple locations efficiently
export async function batchGeocode(locations) {
  const results = [];
  const cache = loadCache();
  let newCacheEntries = 0;
  
  console.log(`Starting batch geocode of ${locations.length} locations...`);
  
  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    const { city, state } = location;
    const cacheKey = `${city.toLowerCase().trim()}, ${state.toLowerCase().trim()}`;
    
    let coordinates = cache[cacheKey];
    
    if (!coordinates && coordinates !== null) { // null means we've tried and failed before
      coordinates = await geocodeCity(city, state);
      newCacheEntries++;
    }
    
    results.push({
      ...location,
      coordinates,
      cached: cache[cacheKey] !== undefined
    });
    
    // Progress update every 50 items
    if ((i + 1) % 50 === 0) {
      console.log(`Batch geocode progress: ${i + 1}/${locations.length} (${newCacheEntries} new)`);
    }
  }
  
  console.log(`Batch geocode complete: ${results.length} processed, ${newCacheEntries} new cache entries`);
  
  return results;
}

// Utility function to get cache statistics
export function getCacheStats() {
  const cache = loadCache();
  const total = Object.keys(cache).length;
  const successful = Object.values(cache).filter(coord => coord !== null).length;
  const failed = total - successful;
  
  return {
    total,
    successful,
    failed,
    cache_file: CACHE_FILE
  };
}