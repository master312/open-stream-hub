import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface StreamAnalytics {
  runtime: string;
  viewers: number;
  bandwidth: string;
  cpuUsage: number;
  viewerHistory: {
    time: string;
    count: number;
  }[];
}

interface StreamAnalyticsProps {
  analytics: StreamAnalytics;
}

export const StreamAnalytics: React.FC<StreamAnalyticsProps> = ({ analytics }) => {
  const chartData = {
    labels: analytics.viewerHistory.map((vh) => vh.time),
    datasets: [
      {
        label: "Viewers",
        data: analytics.viewerHistory.map((vh) => vh.count),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#e2e8f0",
        bodyColor: "#e2e8f0",
        borderColor: "#334155",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#94a3b8",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#1e293b",
        },
        ticks: {
          color: "#94a3b8",
        },
      },
    },
  };

  return (
    <div className="card p-6 space-y-6">
      <h2 className="text-lg font-medium text-content-primary">Analytics</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-background-hover rounded-lg">
          <div className="text-content-secondary text-sm">Runtime</div>
          <div className="text-content-primary text-lg font-medium mt-1">
            TODO
            <br />
            {analytics.runtime}
          </div>
        </div>

        <div className="p-4 bg-background-hover rounded-lg">
          <div className="text-content-secondary text-sm">Current Viewers</div>
          <div className="text-content-primary text-lg font-medium mt-1">
            TODO
            <br />
            {analytics.viewers}
          </div>
        </div>

        <div className="p-4 bg-background-hover rounded-lg">
          <div className="text-content-secondary text-sm">Bandwidth</div>
          <div className="text-content-primary text-lg font-medium mt-1">
            TODO
            <br />
            {analytics.bandwidth}
          </div>
        </div>

        <div className="p-4 bg-background-hover rounded-lg">
          <div className="text-content-secondary text-sm">CPU Usage</div>
          <div className="text-content-primary text-lg font-medium mt-1">
            TODO
            <br />
            {analytics.cpuUsage}%
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-content-secondary text-sm mb-4">Viewer History</h3>
        <div className="h-48">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};
