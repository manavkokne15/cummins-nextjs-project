import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { geocodeCity } from '@/utils/geocode2';

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

    console.log(`Processing ${records.length} vehicle records...`);

    // Convert to GeoJSON
    const features = [];
    let processedCount = 0;
    let failedCount = 0;

    for (const record of records) {
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

        // Calculate concentration weight based on type
        const concentrationType = parseInt(record.Concentration_Type) || 1;
        let concentrationWeight;
        
        switch (concentrationType) {
          case 0:
            concentrationWeight = 0.1;
            break;
          case 1:
            concentrationWeight = 0.3;
            break;
          case 2:
            concentrationWeight = 0.7;
            break;
          case 3:
            concentrationWeight = 1.0;
            break;
          default:
            concentrationWeight = 0.3;
        }

        // Multiply by vehicle count for additional weight
        const vehicleCount = parseInt(record.Vehicle_Count) || 1;
        const finalWeight = concentrationWeight * Math.log(vehicleCount + 1) / 10;

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
            vehicle_class: record.Vehicle_Class || '',
            vehicle_type: record.Vehicle_Type || '',
            fuel_type: record.Fuel_Type || '',
            concentration_type: concentrationType,
            concentration_description: record.Concentration_Description || '',
            concentration_weight: finalWeight
          }
        };

        features.push(feature);
        processedCount++;

      } catch (error) {
        console.error(`Error processing record:`, error, record);
        failedCount++;
      }
    }

    console.log(`Successfully processed: ${processedCount}, Failed: ${failedCount}`);

    // Create GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: features
    };

    // Return the GeoJSON with appropriate headers
    return NextResponse.json(geojson, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('Error generating GeoJSON:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate GeoJSON', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}