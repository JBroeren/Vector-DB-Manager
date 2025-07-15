import { NextResponse } from 'next/server';
import { weaviateService } from '@/lib/weaviate';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { className, query, limit = 10 } = body;
    
    if (!className || !query) {
      return NextResponse.json({ error: 'className and query are required' }, { status: 400 });
    }

    const results = await weaviateService.searchObjects(className, query, limit);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching objects:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}