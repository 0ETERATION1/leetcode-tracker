import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number;
}

export const runtime = 'nodejs'; // Change to nodejs runtime

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db('leetcode-tracker');
    const collection = db.collection<LeetCodeSubmission>('submissions');

    // Add build-time protection
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'production') {
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
    } else {
      // Skip during build time
      return NextResponse.json({ 
        message: 'Skipped during build' 
      });
    }
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';