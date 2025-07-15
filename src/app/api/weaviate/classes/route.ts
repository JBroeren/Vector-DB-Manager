import { NextResponse } from 'next/server';
import { weaviateService } from '@/lib/weaviate';

export async function GET() {
  try {
    const classes = await weaviateService.getClasses();
    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ classes: [], error: 'Failed to fetch classes' }, { status: 500 });
  }
}