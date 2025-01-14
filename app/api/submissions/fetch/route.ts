import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  console.log('Raw dates received:', { startDate, endDate });
  
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db('leetcode-tracker');
  const collection = db.collection('submissions');

  // Convert dates to start and end of day timestamps
  const startTimestamp = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000).toString();
  const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000).toString();
  
  console.log('Query timestamps:', { 
    startTimestamp, 
    endTimestamp,
    startDateConverted: new Date(parseInt(startTimestamp) * 1000).toISOString(),
    endDateConverted: new Date(parseInt(endTimestamp) * 1000).toISOString()
  });

  try {
    // First get all submissions to verify what we have
    const allSubmissions = await collection.find({}).toArray();
    console.log('All submissions date range:', {
      earliest: new Date(parseInt(allSubmissions.reduce((min, s) => 
        Math.min(parseInt(min), parseInt(s.timestamp)).toString(), 
        allSubmissions[0].timestamp
      )) * 1000).toISOString(),
      latest: new Date(parseInt(allSubmissions.reduce((max, s) => 
        Math.max(parseInt(max), parseInt(s.timestamp)).toString(),
        allSubmissions[0].timestamp
      )) * 1000).toISOString(),
      count: allSubmissions.length
    });

    const submissions = await collection
      .find({
        timestamp: {
          $gte: startTimestamp,
          $lte: endTimestamp
        }
      })
      .sort({ timestamp: -1 }) // Changed from 1 to -1 to sort descending
      .toArray();

    console.log(`Found ${submissions.length} submissions in date range`);

    return NextResponse.json({ 
      success: true,
      submissions,
      query: {
        startDate,
        endDate,
        startTimestamp,
        endTimestamp
      }
    });
  } catch (error) {
    console.error('Error retrieving submissions:', error);
    return NextResponse.json(
      { error: 'Error retrieving submissions' },
      { status: 500 }
    );
  }
} 