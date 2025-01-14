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

export async function POST(request: Request) {
  const client = await clientPromise;
  const db = client.db('leetcode-tracker');
  const collection = db.collection<LeetCodeSubmission>('submissions');

  const { submissions } = await request.json() as { submissions: LeetCodeSubmission[] };

  try {
    const operations = submissions.map((submission: LeetCodeSubmission) => ({
      updateOne: {
        filter: { id: submission.id },
        update: { $set: submission },
        upsert: true,
      },
    }));
    await collection.bulkWrite(operations);

    return NextResponse.json({ message: 'Submissions saved' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error saving submissions to database' },
      { status: 500 }
    );
  }
} 