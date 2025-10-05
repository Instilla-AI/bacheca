import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_API_URL = process.env.RAILWAY_API_URL;
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.query || !body.dataset_id) {
      return NextResponse.json(
        { error: 'Missing required fields: query and dataset_id' },
        { status: 400 }
      );
    }

    // Get user ID from headers (optional)
    const userId = request.headers.get('x-user-id') || 'anonymous';

    // Forward request to Railway backend
    const response = await fetch(`${RAILWAY_API_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_API_KEY}`,
        'X-User-ID': userId,
      },
      body: JSON.stringify({
        query: body.query,
        dataset_id: body.dataset_id,
        project_id: body.project_id,
        limit: body.limit || 100,
        model_provider: body.model_provider || 'claude',
        model_name: body.model_name,
        api_key: body.api_key,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Query failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error processing query:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
