import { NextResponse } from 'next/server';
import { weaviateService } from '@/lib/weaviate';

export async function GET() {
  try {
    const stats = await weaviateService.getDatabaseStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json({ stats: null, error: 'Failed to fetch stats' }, { status: 500 });
  }
}