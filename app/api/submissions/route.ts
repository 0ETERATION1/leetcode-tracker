import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
}

export async function POST(request: Request) {
  try {
    const { submissions } = await request.json() as { submissions: LeetCodeSubmission[] };
    const client = await clientPromise;
    const db = client.db('leetcode-tracker');
    const collection = db.collection<LeetCodeSubmission>('submissions');

    // Get existing submission IDs
    const existingIds = new Set(
      (await collection.find({}, { projection: { id: 1 } }).toArray())
        .map(doc => doc.id)
    );

    // Filter out submissions we already have
    const newSubmissions = submissions.filter(
      (submission: LeetCodeSubmission) => !existingIds.has(submission.id)
    );

    if (newSubmissions.length > 0) {
      // Insert only new submissions
      await collection.insertMany(newSubmissions);
      console.log(`Added ${newSubmissions.length} new submissions`);
    } else {
      console.log('No new submissions to add');
    }

    return NextResponse.json({ 
      success: true,
      added: newSubmissions.length
    });
  } catch (error) {
    console.error('Error storing submissions:', error);
    return NextResponse.json(
      { error: 'Error storing submissions' },
      { status: 500 }
    );
  }
} 