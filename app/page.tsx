"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Load Chart.js dynamically
const Chart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number;
}

export default function Home() {
  const [submissions, setSubmissions] = useState<LeetCodeSubmission[]>([]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(
        `/api/submissions/fetch?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      setSubmissions(data.submissions);
    }
    fetchData();
  }, [startDate, endDate]);

  // Process data for the chart
  const dates = submissions.map(
    (s) => new Date(s.timestamp * 1000).toISOString().split("T")[0]
  );
  const submissionsPerDate = dates.reduce<Record<string, number>>(
    (acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {}
  );

  const chartData = {
    labels: Object.keys(submissionsPerDate),
    datasets: [
      {
        label: "Submissions",
        data: Object.values(submissionsPerDate),
        backgroundColor: "rgba(75,192,192,0.6)",
      },
    ],
  };

  return (
    <div>
      <h1>LeetCode Activity Tracker</h1>
      <div>
        <label>Start Date: </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>End Date: </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <Chart data={chartData} />
      <h2>Specific Questions Solved:</h2>
      <ul>
        {submissions.map((submission) => (
          <li key={submission.id}>
            {new Date(submission.timestamp * 1000).toLocaleString()} -{" "}
            {submission.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
