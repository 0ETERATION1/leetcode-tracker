import { NextResponse } from 'next/server';
import axios from 'axios';

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  const query = `
    query recentAcSubmissionList($username: String!) {
      recentAcSubmissionList(username: $username, limit: 20) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  try {
    console.log('Fetching LeetCode data for:', username);
    
    const response = await axios.post(
      'https://leetcode.com/graphql',
      {
        query,
        variables: { username }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (response.data.errors) {
      console.error('GraphQL Errors:', response.data.errors);
      return NextResponse.json(
        { error: 'GraphQL query failed', details: response.data.errors },
        { status: 500 }
      );
    }

    const submissions = response.data.data.recentAcSubmissionList as LeetCodeSubmission[];
    console.log(`Found ${submissions.length} submissions`);

    // Store in MongoDB
    const mongoRes = await fetch(new URL('/api/submissions', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ submissions }),
    });

    if (!mongoRes.ok) {
      throw new Error('Failed to store submissions in MongoDB');
    }

    return NextResponse.json({
      success: true,
      submissions,
    });

  } catch (error: unknown) {
    console.error('LeetCode API Error:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching from LeetCode',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 