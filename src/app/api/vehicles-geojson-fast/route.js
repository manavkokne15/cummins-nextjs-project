import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the pre-generated GeoJSON file
    const geojsonPath = path.join(process.cwd(), 'public', 'vehicles-heatmap-data.geojson');
    
    // Check if the file exists
    if (!fs.existsSync(geojsonPath)) {
      console.error('Pre-generated GeoJSON file not found at:', geojsonPath);
      return NextResponse.json(
        { error: 'Heatmap data not found. Please generate the static data first.' },
        { status: 404 }
      );
    }

    // Read and parse the pre-generated GeoJSON file
    const geojsonData = fs.readFileSync(geojsonPath, 'utf-8');
    const parsedData = JSON.parse(geojsonData);

    console.log(`🚀 Serving static heatmap data: ${parsedData.features.length} locations (INSTANT LOAD!)`);

    // Return the pre-generated GeoJSON with caching headers
    return NextResponse.json(parsedData, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'X-Data-Source': 'static-pregenerated'
      }
    });

  } catch (error) {
    console.error('Error serving static heatmap data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load heatmap data', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}