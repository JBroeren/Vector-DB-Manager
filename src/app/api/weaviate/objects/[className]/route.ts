import { NextResponse } from 'next/server';
import { weaviateService } from '@/lib/weaviate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ className: string }> }
) {
  try {
    const { className } = await params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const result = await weaviateService.getClassObjectsWithCount(className, limit, offset);
    
    return NextResponse.json({
      objects: result.objects,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        pageSize: limit,
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json({ 
      objects: [], 
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, pageSize: limit, hasMore: false },
      error: 'Failed to fetch objects' 
    }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ className: string }> }
) {
  try {
    const { className } = await params;
    const body = await request.json();
    const result = await weaviateService.createObject(className, body.properties);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error creating object:', error);
    return NextResponse.json({ success: false, error: 'Failed to create object' }, { status: 500 });
  }
}