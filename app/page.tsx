"use client";

import { useState, useEffect, useCallback } from "react";
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
  timestamp: string;
}

export default function Home() {
  const [submissions, setSubmissions] = useState<LeetCodeSubmission[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const username = "terskinalex";

  // Define fetchSubmissions with useCallback
  const fetchSubmissions = useCallback(async () => {
    if (!startDate || !endDate) return;
    console.log("Fetching submissions for date range:", { startDate, endDate });
    const submissionsRes = await fetch(
      `/api/submissions/fetch?startDate=${startDate}&endDate=${endDate}`
    );
    const submissionsData = await submissionsRes.json();
    if (submissionsData.submissions) {
      setSubmissions(submissionsData.submissions);
    }
  }, [startDate, endDate]);

  // Define resetAndFetch with useCallback
  const resetAndFetch = useCallback(async () => {
    try {
      console.log("Fetching fresh data...");
      const leetcodeRes = await fetch(`/api/leetcode?username=${username}`);
      if (!leetcodeRes.ok) {
        throw new Error("Failed to fetch LeetCode data");
      }

      setLastUpdate(new Date());
      console.log("Data refresh complete");

      // Fetch submissions after fetching new data
      await fetchSubmissions();
    } catch (error) {
      console.error("Error during reset and fetch:", error);
    }
  }, [fetchSubmissions, username]);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      const startOf2025 = "2025-01-01";
      const today = new Date().toISOString().split("T")[0];

      setStartDate(startOf2025);
      setEndDate(today);

      await resetAndFetch();
    };

    initializeData();
  }, [resetAndFetch]); // Add resetAndFetch to dependencies

  // Re-fetch submissions when dates change
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]); // Add fetchSubmissions to dependencies

  // Calculate total time spent between start and end dates
  const totalTimeInMinutes = submissions.length * 30;
  const hours = Math.floor(totalTimeInMinutes / 60);
  const minutes = totalTimeInMinutes % 60;

  // Process data for the chart - ensure we're handling dates correctly
  const submissionsByDate = submissions.reduce<
    Record<string, LeetCodeSubmission[]>
  >((acc, submission) => {
    const date = new Date(parseInt(submission.timestamp) * 1000)
      .toISOString()
      .split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(submission);
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(submissionsByDate).sort(),
    datasets: [
      {
        label: "Submissions",
        data: Object.keys(submissionsByDate)
          .sort()
          .map((date) => submissionsByDate[date].length),
        backgroundColor: "rgba(75,192,192,0.6)",
        yAxisID: "y",
      },
      {
        label: "Time Spent (minutes)",
        data: Object.keys(submissionsByDate)
          .sort()
          .map((date) => submissionsByDate[date].length * 30),
        backgroundColor: "rgba(153,102,255,0.6)",
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Number of Submissions",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Time Spent (minutes)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Add a useEffect to log when submissions change
  useEffect(() => {
    console.log("Submissions state updated:", submissions);
  }, [submissions]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">LeetCode Activity Tracker</h1>

      {/* Last update time */}
      <div className="mb-4 text-sm text-gray-600">
        Last updated: {lastUpdate ? lastUpdate.toLocaleString() : "Never"}
      </div>

      {/* Date selection */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="mr-2">Start Date: </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="mr-2">End Date: </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Total time spent summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <p>Total Problems Solved: {submissions.length}</p>
        <p>
          Total Time Spent: {hours} hours {minutes} minutes
        </p>
      </div>

      {/* Chart */}
      <div className="mb-8">
        <Chart data={chartData} options={chartOptions} />
      </div>

      {/* Submissions list */}
      <h2 className="text-xl font-semibold mb-4">Specific Questions Solved:</h2>
      <ul className="space-y-2">
        {submissions &&
          submissions.map((submission) => (
            <li
              key={submission.id}
              className="flex justify-between items-center p-2 hover:bg-gray-50"
            >
              <div>
                <span className="font-medium">{submission.title}</span>
                <span className="text-gray-500 ml-2">
                  {new Date(
                    parseInt(submission.timestamp) * 1000
                  ).toLocaleString()}
                </span>
              </div>
              <span className="text-gray-600">Estimated time: 30 minutes</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
