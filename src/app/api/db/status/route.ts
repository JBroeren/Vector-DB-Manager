import { dbService } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get database type from cookie or environment
    const cookies = (request as any).cookies;
    const dbTypeCookie = cookies.get('db-type')?.value;
    const dbType = dbTypeCookie && ['weaviate', 'qdrant'].includes(dbTypeCookie) 
      ? dbTypeCookie 
      : (process.env.DATABASE_TYPE || 'weaviate');
    
    const connected = await dbService.checkConnection();
    return NextResponse.json({ 
      dbType, 
      connected,
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ 
      dbType: process.env.DATABASE_TYPE || 'weaviate', 
      connected: false,
      error: 'Failed to check connection',
      timestamp: new Date().toISOString()
    });
  }
}