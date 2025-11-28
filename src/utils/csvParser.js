/**
 * Parse vehicle CSV data from public folder
 * @returns {Promise<Array>} Array of vehicle records with parsed data
 */
export async function parseVehicleCSV() {
  try {
    const response = await fetch('/vehicle_demo_data.csv');
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const record = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      
      data.push({
        state: record.State,
        city: record.City,
        vehicleCount: parseInt(record.Vehicle_Count) || 0,
        vehicleClass: record.Vehicle_Class,
        vehicleType: record.Vehicle_Type,
        fuelType: record.Fuel_Type,
      });
    }
    
    console.log('CSV parsed successfully:', data.length, 'records', data.slice(0, 3));
    return data;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

/**
 * Group vehicles by class type
 * @param {Array} vehicles - Vehicle records
 * @returns {Object} Grouped data by vehicle class
 */
export function groupByVehicleClass(vehicles) {
  const grouped = {};
  
  vehicles.forEach(vehicle => {
    const classType = vehicle.vehicleClass || 'Unknown';
    if (!grouped[classType]) {
      grouped[classType] = [];
    }
    grouped[classType].push(vehicle);
  });
  
  return grouped;
}

/**
 * Get coordinates from city/state using geocoding cache
 * @param {string} city - City name
 * @param {string} state - State name
 * @returns {Object} Coordinates {lat, lng}
 */
export const cityCoordsCache = {
  // Major US cities geocoded - comprehensive list
  'Erie,Pennsylvania': { lat: 42.0815, lng: -80.0884 },
  'Cape Coral,Florida': { lat: 26.5628, lng: -81.9496 },
  'Lynn,Massachusetts': { lat: 42.4656, lng: -70.9496 },
  'Flint,Michigan': { lat: 43.1081, lng: -83.6873 },
  'Thornton,Colorado': { lat: 39.8667, lng: -104.9667 },
  'Winston-Salem,North Carolina': { lat: 36.0999, lng: -79.7626 },
  'Buffalo,New York': { lat: 42.8864, lng: -78.8784 },
  'Federal Way,Washington': { lat: 47.3222, lng: -122.3121 },
  'Miami,Florida': { lat: 25.7617, lng: -80.1918 },
  'Tallahassee,Florida': { lat: 30.4383, lng: -84.2807 },
  'Oakland,California': { lat: 37.8044, lng: -122.2712 },
  'Peoria,Arizona': { lat: 33.5805, lng: -112.2273 },
  'Brockton,Massachusetts': { lat: 42.0834, lng: -71.0341 },
  'Reading,Pennsylvania': { lat: 40.3336, lng: -75.9305 },
  'Lowell,Massachusetts': { lat: 42.6394, lng: -71.3162 },
  'Bartlett,Tennessee': { lat: 35.1998, lng: -89.8334 },
  'Peoria,Illinois': { lat: 40.6934, lng: -89.5890 },
  'Elgin,Illinois': { lat: 42.0379, lng: -88.2809 },
  'Gilbert,Arizona': { lat: 33.3064, lng: -111.7899 },
  'Laredo,Texas': { lat: 27.5305, lng: -99.4867 },
  'Albany,New York': { lat: 42.6526, lng: -73.7562 },
  'Warren,Michigan': { lat: 42.4787, lng: -83.0379 },
  'Rochester,New York': { lat: 43.1629, lng: -77.6076 },
  'Cincinnati,Ohio': { lat: 39.1618, lng: -84.4674 },
  'Tampa,Florida': { lat: 27.9506, lng: -82.4572 },
  'Surprise,Arizona': { lat: 33.6386, lng: -112.3686 },
  'Boston,Massachusetts': { lat: 42.3601, lng: -71.0589 },
  'Harrisburg,Pennsylvania': { lat: 40.2732, lng: -76.8867 },
  'Colorado Springs,Colorado': { lat: 38.8339, lng: -104.8202 },
  'Cambridge,Massachusetts': { lat: 42.3736, lng: -71.1097 },
  'Worcester,Massachusetts': { lat: 42.2625, lng: -71.8023 },
  'Corpus Christi,Texas': { lat: 27.5791, lng: -97.3964 },
  'Tacoma,Washington': { lat: 47.2529, lng: -122.4443 },
  'Columbus,Georgia': { lat: 32.4613, lng: -84.9711 },
  'Knoxville,Tennessee': { lat: 35.9606, lng: -83.9207 },
  'Pueblo,Colorado': { lat: 38.2544, lng: -104.6091 },
  'Utica,New York': { lat: 43.1008, lng: -75.2348 },
  'Chattanooga,Tennessee': { lat: 35.0456, lng: -85.3097 },
  'Arlington,Texas': { lat: 32.7357, lng: -97.2247 },
  'Wilmington,North Carolina': { lat: 34.2257, lng: -77.9447 },
  'High Point,North Carolina': { lat: 35.9557, lng: -79.9711 },
  'San Francisco,California': { lat: 37.7749, lng: -122.4194 },
  'New York,New York': { lat: 40.7128, lng: -74.0060 },
  'Los Angeles,California': { lat: 34.0522, lng: -118.2437 },
  'Chicago,Illinois': { lat: 41.8781, lng: -87.6298 },
  'Houston,Texas': { lat: 29.7604, lng: -95.3698 },
  'Phoenix,Arizona': { lat: 33.4484, lng: -112.0742 },
  'Philadelphia,Pennsylvania': { lat: 39.9526, lng: -75.1652 },
  'San Antonio,Texas': { lat: 29.4241, lng: -98.4936 },
  'San Diego,California': { lat: 32.7157, lng: -117.1611 },
  'Dallas,Texas': { lat: 32.7767, lng: -96.7970 },
  'San Jose,California': { lat: 37.3382, lng: -121.8863 },
  'Austin,Texas': { lat: 30.2672, lng: -97.7431 },
  'Jacksonville,Florida': { lat: 30.3322, lng: -81.6557 },
  'Fort Worth,Texas': { lat: 32.7555, lng: -97.3308 },
  'Columbus,Ohio': { lat: 39.9612, lng: -82.9988 },
  'Charlotte,North Carolina': { lat: 35.2271, lng: -80.8431 },
  'San Francisco,California': { lat: 37.7749, lng: -122.4194 },
  'Indianapolis,Indiana': { lat: 39.7684, lng: -86.1581 },
  'Seattle,Washington': { lat: 47.6062, lng: -122.3321 },
  'Denver,Colorado': { lat: 39.7392, lng: -104.9903 },
  'Washington,District of Columbia': { lat: 38.9072, lng: -77.0369 },
  'Boston,Massachusetts': { lat: 42.3601, lng: -71.0589 },
  'El Paso,Texas': { lat: 31.7619, lng: -106.4850 },
  'Nashville,Tennessee': { lat: 36.1627, lng: -86.7816 },
  'Detroit,Michigan': { lat: 42.3314, lng: -83.0458 },
  'Oklahoma City,Oklahoma': { lat: 35.4676, lng: -97.5164 },
  'Portland,Oregon': { lat: 45.5152, lng: -122.6784 },
  'Las Vegas,Nevada': { lat: 36.1699, lng: -115.1398 },
  'Memphis,Tennessee': { lat: 35.1495, lng: -90.0490 },
  'Louisville,Kentucky': { lat: 38.2527, lng: -85.7585 },
  'Baltimore,Maryland': { lat: 39.2904, lng: -76.6122 },
  'Milwaukee,Wisconsin': { lat: 43.0389, lng: -87.9065 },
  'Albuquerque,New Mexico': { lat: 35.0844, lng: -106.6504 },
  'Tucson,Arizona': { lat: 32.2217, lng: -110.9265 },
  'Fresno,California': { lat: 36.7469, lng: -119.7726 },
  'Mesa,Arizona': { lat: 33.4152, lng: -111.8313 },
  'Sacramento,California': { lat: 38.5816, lng: -121.4944 },
  'Atlanta,Georgia': { lat: 33.7490, lng: -84.3880 },
  'Kansas City,Missouri': { lat: 39.0997, lng: -94.5786 },
  'Long Beach,California': { lat: 33.7701, lng: -118.1937 },
  'Fresno,California': { lat: 36.7469, lng: -119.7726 },
  'St. Louis,Missouri': { lat: 38.6270, lng: -90.1994 },
  'Bakersfield,California': { lat: 35.3733, lng: -119.0187 },
  'Henderson,Nevada': { lat: 36.0395, lng: -114.9817 },
  'New Orleans,Louisiana': { lat: 29.9511, lng: -90.2623 },
  'Stockton,California': { lat: 37.9577, lng: -121.2911 },
  'Corpus Christi,Texas': { lat: 27.5791, lng: -97.3964 },
  'Saint Paul,Minnesota': { lat: 44.9537, lng: -93.0900 },
  'Cincinnati,Ohio': { lat: 39.1618, lng: -84.4674 },
  'Riverside,California': { lat: 33.9826, lng: -117.2648 },
  'Lexington,Kentucky': { lat: 38.0297, lng: -84.4784 },
  'Irvine,California': { lat: 33.6846, lng: -117.8265 },
  'Anchorage,Alaska': { lat: 61.2181, lng: -149.9003 },
  'Plano,Texas': { lat: 33.0198, lng: -96.6989 },
  'Orlando,Florida': { lat: 28.5421, lng: -81.3723 },
  'Chula Vista,California': { lat: 32.6401, lng: -117.0842 },
  'Garland,Texas': { lat: 32.9126, lng: -96.6345 },
  'Phoenix,Arizona': { lat: 33.4484, lng: -112.0742 },
  'Irving,Texas': { lat: 32.8343, lng: -96.4867 },
  'Scottsdale,Arizona': { lat: 33.4942, lng: -111.9261 },
  'North Las Vegas,Nevada': { lat: 36.1989, lng: -115.1176 },
  'Fontana,California': { lat: 34.0922, lng: -117.4351 },
  'Moreno Valley,California': { lat: 33.7428, lng: -117.2297 },
  'Fremont,California': { lat: 37.5485, lng: -122.2710 },
  'Baton Rouge,Louisiana': { lat: 30.4515, lng: -91.1871 },
  'Richmond,Virginia': { lat: 37.5407, lng: -77.4360 },
  'San Bernardino,California': { lat: 34.1083, lng: -117.2898 },
  'Birmingham,Alabama': { lat: 33.5186, lng: -86.8104 },
  'Spokane,Washington': { lat: 47.6587, lng: -117.4260 },
};

/**
 * Get cached coordinates for a city
 * @param {string} city - City name
 * @param {string} state - State name
 * @returns {Object|null} Coordinates or null if not found
 */
export function getCityCoordinates(city, state) {
  const key = `${city},${state}`;
  return cityCoordsCache[key] || null;
}

/**
 * Aggregate vehicle data by location
 * @param {Array} vehicles - Vehicle records
 * @returns {Array} Aggregated data with coordinates
 */
export function aggregateByLocation(vehicles) {
  const locationMap = new Map();
  
  vehicles.forEach(vehicle => {
    const coords = getCityCoordinates(vehicle.city, vehicle.state);
    if (!coords) return;
    
    const key = `${vehicle.city},${vehicle.state}`;
    
    if (!locationMap.has(key)) {
      locationMap.set(key, {
        city: vehicle.city,
        state: vehicle.state,
        lat: coords.lat,
        lng: coords.lng,
        byClass: {},
        totalVehicles: 0,
      });
    }
    
    const location = locationMap.get(key);
    const classType = vehicle.vehicleClass || 'Unknown';
    
    if (!location.byClass[classType]) {
      location.byClass[classType] = 0;
    }
    
    location.byClass[classType] += vehicle.vehicleCount;
    location.totalVehicles += vehicle.vehicleCount;
  });
  
  return Array.from(locationMap.values());
}

/**
 * Get unique vehicle classes
 * @param {Array} vehicles - Vehicle records
 * @returns {Array} Unique vehicle classes
 */
export function getUniqueVehicleClasses(vehicles) {
  const classes = new Set();
  vehicles.forEach(v => {
    if (v.vehicleClass) classes.add(v.vehicleClass);
  });
  return Array.from(classes).sort();
}

/**
 * Get color for vehicle class
 * @param {string} vehicleClass - Vehicle class number (6, 7, 8)
 * @returns {string} Hex color code
 */
export function getClassColor(vehicleClass) {
  const colorMap = {
    '6': '#10b981',     // Bright Green - Medium Duty
    '7': '#f59e0b',     // Bright Orange - Heavy-Medium Duty
    '8': '#ef4444',     // Bright Red - Heavy Duty
  };
  
  return colorMap[vehicleClass] || '#3b82f6';
}

/**
 * Get vehicle type description for class number
 * @param {string} vehicleClass - Vehicle class number (6, 7, 8)
 * @returns {string} Vehicle type description
 */
export function getVehicleTypeDescription(vehicleClass) {
  const typeMap = {
    '6': 'Medium Duty',
    '7': 'Heavy-Medium Duty',
    '8': 'Heavy Duty',
  };
  
  return typeMap[vehicleClass] || 'Unknown';
}

/**
 * Get intensity for heatmap (0-1)
 * @param {number} count - Vehicle count
 * @param {number} maxCount - Maximum count in dataset
 * @returns {number} Intensity value 0-1
 */
export function getHeatmapIntensity(count, maxCount) {
  return Math.min(count / maxCount, 1);
}
