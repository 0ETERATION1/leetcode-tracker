import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number;
}

export async function POST() {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json(
      { error: 'MongoDB URI not configured' },
      { status: 500 }
    );
  }

  const client = await clientPromise;
  const db = client.db('leetcode-tracker');
  const collection = db.collection<LeetCodeSubmission>('submissions');

  // Create some test submissions for the last 7 days
  const testSubmissions: LeetCodeSubmission[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add 1-3 submissions per day
    const submissionsCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < submissionsCount; j++) {
      testSubmissions.push({
        id: `test-${i}-${j}`,
        title: `Test Problem ${i + 1}`,
        titleSlug: `test-problem-${i + 1}`,
        timestamp: Math.floor(date.getTime() / 1000)
      });
    }
  }

  try {
    await collection.deleteMany({}); // Clear existing test data
    await collection.insertMany(testSubmissions);
    return NextResponse.json({ 
      message: 'Test data seeded successfully',
      count: testSubmissions.length 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error seeding test data' },
      { status: 500 }
    );
  }
}