// app/api/model/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://bigquery-mcp-sse-production.up.railway.app';
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY || 'bq_secure_key_2024_f8a3c9d1e5b7';

interface ModelConfig {
  provider: 'claude' | 'openai' | 'gemini';
  model_name: string;
  api_key: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body: ModelConfig = await request.json();
    
    // Validate
    if (!body.provider || !body.model_name || !body.api_key) {
      return NextResponse.json(
        { error: 'provider, model_name, and api_key are required' },
        { status: 400 }
      );
    }
    
    // Save to Railway API (which stores in Postgres)
    const response = await fetch(`${RAILWAY_API_URL}/api/model/config`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        provider: body.provider,
        model_name: body.model_name,
        api_key: body.api_key,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save configuration');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error saving model config:', error);
    return NextResponse.json(
      { error: 'Failed to save model configuration' },
      { status: 500 }
    );
  }
}
