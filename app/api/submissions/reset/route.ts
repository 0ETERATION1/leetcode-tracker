import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db('leetcode-tracker');
    
    // Drop the existing collection
    await db.collection('submissions').drop().catch(() => {
      // Ignore error if collection doesn't exist
      console.log('Collection did not exist, creating new one');
    });
    
    // Create a new collection
    await db.createCollection('submissions');
    
    // Create an index on the timestamp field
    await db.collection('submissions').createIndex({ timestamp: -1 });
    
    console.log('Successfully reset submissions collection');
    
    return NextResponse.json({ 
      success: true,
      message: 'Collection reset successfully'
    });
  } catch (error) {
    console.error('Error resetting collection:', error);
    return NextResponse.json(
      { error: 'Error resetting collection' },
      { status: 500 }
    );
  }
} 