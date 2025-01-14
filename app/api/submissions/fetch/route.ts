import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number;
  difficulty?: string;
  status?: string;
  lang?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db('leetcode-tracker');
  const collection = db.collection<LeetCodeSubmission>('submissions');

  try {
    const submissions = await collection
      .find({
        timestamp: {
          $gte: Math.floor(new Date(startDate).getTime() / 1000),
          $lte: Math.floor(new Date(endDate).getTime() / 1000),
        },
      })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error retrieving submissions' },
      { status: 500 }
    );
  }
} 