import { NextResponse } from 'next/server';
import axios from 'axios';

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
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

  // GraphQL query using submissionList with pagination
  const query = `
    query submissionList($username: String!, $offset: Int!, $limit: Int!) {
      submissionList(username: $username, offset: $offset, limit: $limit) {
        hasNext
        submissions {
          id
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    }
  `;

  try {
    console.log('Fetching submissions for', username);

    let allSubmissions: LeetCodeSubmission[] = [];
    let offset = 0;
    const limit = 20; // Default page size
    let hasNext = true;

    // Pagination loop
    while (hasNext) {
      console.log(`Fetching submissions with offset ${offset}`);

      const response = await axios.post(
        'https://leetcode.com/graphql',
        {
          query,
          variables: { username, offset, limit },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;
      if (data.errors) {
        throw new Error(JSON.stringify(data.errors));
      }

      const submissionList = data.data.submissionList;
      if (submissionList) {
        const submissions = submissionList.submissions;
        allSubmissions = allSubmissions.concat(submissions);
        hasNext = submissionList.hasNext;
        offset += limit;

        // Optional delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        hasNext = false;
      }
    }

    console.log(`Total submissions fetched: ${allSubmissions.length}`);

    // Filter submissions from the desired date onwards
    const startOfDesiredDate = Math.floor(new Date('2025-01-01').getTime() / 1000);
    const filteredSubmissions = allSubmissions.filter(
      (submission) => parseInt(submission.timestamp) >= startOfDesiredDate
    );

    console.log(`Filtered submissions from 2025 onwards: ${filteredSubmissions.length}`);

    // Store submissions in MongoDB (already handles duplicates)
    const mongoRes = await fetch(new URL('/api/submissions', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ submissions: filteredSubmissions }),
    });

    if (!mongoRes.ok) {
      throw new Error('Failed to store submissions');
    }

    return NextResponse.json({
      submissions: filteredSubmissions,
      stats: {
        total: filteredSubmissions.length,
        dateRange: filteredSubmissions.length > 0
          ? {
              from: new Date(parseInt(filteredSubmissions[filteredSubmissions.length - 1].timestamp) * 1000).toISOString(),
              to: new Date(parseInt(filteredSubmissions[0].timestamp) * 1000).toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching from LeetCode:', error);
    return NextResponse.json(
      { error: 'Error fetching submissions from LeetCode' },
      { status: 500 }
    );
  }
} 