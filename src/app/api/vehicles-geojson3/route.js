import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { geocodeCity } from '@/utils/geocode3';

export async function GET() {
  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'public', 'vehicle_demo_data.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'CSV file not found at public/vehicle_demo_data.csv' },
        { status: 404 }
      );
    }

    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Processing ${records.length} vehicle records for Leaflet heatmap...`);

    // Sample 1000 records with equal proportions of concentration types
    const sampleSize = 1000;
    const proportionPerType = Math.floor(sampleSize / 3); // 333 per type
    const remainder = sampleSize % 3; // Handle remainder

    // Group records by concentration type
    const recordsByType = {
      0: [], // Highly concentrated
      1: [], // Substantially concentrated  
      2: []  // National
    };

    // Classify records by concentration type
    records.forEach(record => {
      const concentrationType = parseInt(record.Concentration_Type) || 0;
      if (recordsByType[concentrationType]) {
        recordsByType[concentrationType].push(record);
      }
    });

    // Sample records proportionally
    const sampledRecords = [];
    
    // Add equal amounts from each type
    for (let type = 0; type <= 2; type++) {
      const typeRecords = recordsByType[type] || [];
      const sampleCount = proportionPerType + (type < remainder ? 1 : 0);
      
      // Shuffle and take sample
      const shuffled = typeRecords.sort(() => 0.5 - Math.random());
      const sample = shuffled.slice(0, Math.min(sampleCount, typeRecords.length));
      sampledRecords.push(...sample);
      
      console.log(`Concentration Type ${type}: ${typeRecords.length} available, ${sample.length} sampled`);
    }

    console.log(`Final sample: ${sampledRecords.length} records from ${records.length} total`);

    // Convert to GeoJSON - LIMIT TO 200 FOR SPEED
    const MAX_LOCATIONS = 200;
    const features = [];
    let processedCount = 0;
    let failedCount = 0;

    console.log(`🚀 Starting fast geocoding - processing up to ${MAX_LOCATIONS} locations...`);

    // Process records one by one until limit is reached
    for (let i = 0; i < sampledRecords.length && processedCount < MAX_LOCATIONS; i++) {
      const record = sampledRecords[i];
      
      try {
          // Extract city and state
          const city = record.City?.trim();
          const state = record.State?.trim();
          
          if (!city || !state) {
            console.warn(`Skipping record with missing city/state:`, record);
            failedCount++;
            continue;
          }

          // Geocode the location
          const coordinates = await geocodeCity(city, state);
          
          if (!coordinates) {
            console.warn(`Failed to geocode: ${city}, ${state}`);
            failedCount++;
            continue;
          }

          // Parse numeric values
          const concentrationType = parseInt(record.Concentration_Type) || 1;
          const vehicleCount = parseInt(record.Vehicle_Count) || 1;
          const vehicleClass = parseInt(record.Vehicle_Class) || 0;

          // Create GeoJSON feature
          const feature = {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [coordinates.lon, coordinates.lat]
            },
            properties: {
              city: city,
              state: state,
              vehicle_count: vehicleCount,
              vehicle_class: vehicleClass,
              vehicle_type: record.Vehicle_Type || '',
              fuel_type: record.Fuel_Type || '',
              concentration_type: concentrationType,
              concentration_description: record.Concentration_Description || ''
            }
          };

          features.push(feature);
          processedCount++;

          // Progress logging every 20 records
          if (processedCount % 20 === 0) {
            console.log(`✓ Processed ${processedCount}/${MAX_LOCATIONS} locations (${Math.round(processedCount/MAX_LOCATIONS*100)}%)`);
          }

          // Exit early if we've reached the limit
          if (processedCount >= MAX_LOCATIONS) {
            console.log(`🎯 Reached maximum of ${MAX_LOCATIONS} locations - stopping!`);
            break;
          }

      } catch (error) {
          console.error(`Error processing record:`, error, record);
          failedCount++;
      }
    }

    console.log(`Leaflet GeoJSON generation complete - Successfully processed: ${processedCount}, Failed: ${failedCount}`);

    // Create GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: features,
      metadata: {
        total_records: records.length,
        sampled_records: sampledRecords.length,
        processed: processedCount,
        failed: failedCount,
        concentration_distribution: {
          'Highly Concentrated (0)': recordsByType[0]?.length || 0,
          'Substantially Concentrated (1)': recordsByType[1]?.length || 0,
          'National (2)': recordsByType[2]?.length || 0
        },
        generated_at: new Date().toISOString()
      }
    };

    // Return the GeoJSON with appropriate headers
    return NextResponse.json(geojson, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=7200', // Cache for 2 hours
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error generating Leaflet GeoJSON:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate GeoJSON for Leaflet heatmap', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}