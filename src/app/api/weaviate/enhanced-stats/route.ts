import { NextResponse } from 'next/server';
import { weaviateService } from '@/lib/weaviate';

export async function GET() {
  try {
    const enhancedStats = await weaviateService.getEnhancedStats();
    return NextResponse.json({ stats: enhancedStats });
  } catch (error) {
    console.error('Error fetching enhanced stats:', error);
    return NextResponse.json({ stats: null, error: 'Failed to fetch enhanced stats' }, { status: 500 });
  }
}