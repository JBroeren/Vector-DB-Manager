import { NextResponse } from 'next/server';
import { weaviateService } from '@/lib/weaviate';

export async function GET() {
  try {
    const connected = await weaviateService.checkConnection();
    return NextResponse.json({ connected });
  } catch (error) {
    return NextResponse.json({ connected: false, error: 'Connection failed' });
  }
}