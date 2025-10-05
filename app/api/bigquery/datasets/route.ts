// app/api/bigquery/datasets/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://bigquery-mcp-sse-production.up.railway.app';
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY || 'bq_secure_key_2024_f8a3c9d1e5b7';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    
    const url = new URL(`${RAILWAY_API_URL}/api/datasets`);
    if (projectId) {
      url.searchParams.set('project_id', projectId);
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RAILWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Railway API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}
