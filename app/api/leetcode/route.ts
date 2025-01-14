import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('terskinalex');

  const query = `
    query recentAcSubmissions($username: String!) {
      recentAcSubmissionList(username: $username, limit: 100) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;
  const variables = { username };
  const headers = { 'Content-Type': 'application/json' };

  try {
    const response = await axios.post(
      'https://leetcode.com/graphql/',
      { query, variables },
      { headers }
    );
    const submissions = response.data.data.recentAcSubmissionList;

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error fetching data from LeetCode' },
      { status: 500 }
    );
  }
} 