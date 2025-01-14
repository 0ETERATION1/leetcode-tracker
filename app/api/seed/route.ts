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

  // Create test submissions for Jan 1-14, 2023
  const testSubmissions: LeetCodeSubmission[] = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2023-01-14');

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Add 1-3 submissions per day
    const submissionsCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < submissionsCount; j++) {
      testSubmissions.push({
        id: `test-${date.toISOString()}-${j}`,
        title: `Two Sum ${date.getDate()}`,
        titleSlug: `two-sum-${date.getDate()}`,
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