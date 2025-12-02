import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'src', 'utils', 'geocache2.json');
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay between API calls

// Load existing cache
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(cacheData);
    }
  } catch (error) {
    console.warn('Error loading geocache:', error.message);
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
  } catch (error) {
    console.error('Error saving geocache:', error.message);
  }
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Geocode using OpenStreetMap Nominatim API
async function geocodeWithNominatim(city, state) {
  const query = encodeURIComponent(`${city}, ${state}, USA`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=us`;
  
  try {
    console.log(`Geocoding: ${city}, ${state}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Vehicle-Heatmap-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Geocoding failed for ${city}, ${state}:`, error.message);
    return null;
  }
}

// Main geocoding function with caching
export async function geocodeCity(city, state) {
  if (!city || !state) {
    return null;
  }

  const cache = loadCache();
  const cacheKey = `${city.toLowerCase()}, ${state.toLowerCase()}`;
  
  // Check cache first
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }
  
  // Rate limiting - wait between requests
  await sleep(DELAY_BETWEEN_REQUESTS);
  
  // Geocode using Nominatim
  const coordinates = await geocodeWithNominatim(city, state);
  
  if (coordinates) {
    // Save to cache
    cache[cacheKey] = coordinates;
    saveCache(cache);
    console.log(`Cached coordinates for ${city}, ${state}: ${coordinates.lat}, ${coordinates.lon}`);
  }
  
  return coordinates;
}

// Batch geocode function for processing multiple locations
export async function batchGeocode(locations) {
  const results = [];
  const cache = loadCache();
  
  for (const location of locations) {
    const { city, state } = location;
    const cacheKey = `${city.toLowerCase()}, ${state.toLowerCase()}`;
    
    let coordinates = cache[cacheKey];
    
    if (!coordinates) {
      coordinates = await geocodeCity(city, state);
    }
    
    results.push({
      ...location,
      coordinates
    });
  }
  
  return results;
}