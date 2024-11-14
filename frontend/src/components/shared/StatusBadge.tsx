import React from "react";
import { cn } from "../../lib/utils";
import { StreamStatus } from "../../types/stream";

interface StatusBadgeProps {
  status: StreamStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
}) => {
  return (
    <div
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium",
        {
          "bg-status-success bg-opacity-65 text-red-600 border-2 border-status-success border-opacity-100 shadow-sm":
            status === "Live",
          "bg-content-secondary bg-opacity-65 text-content-primary border border-content-secondary border-opacity-100":
            status === "Stopped",
          "bg-yellow-500/20 text-yellow-600 border-2 border-yellow-500 shadow-sm":
            status === "Waiting",
          "bg-status-error/20 text-status-error border-2 border-status-error shadow-sm":
            status === "Error",
        },
        className,
      )}
    >
      <div className="flex items-center space-x-1.5">
        {status === "Live" && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-glow" />
        )}
        {status === "Waiting" && (
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-glow" />
        )}
        {status === "Error" && (
          <span className="w-2 h-2 bg-status-error rounded-full animate-pulse shadow-glow" />
        )}
        <span className="font-bold tracking-wide drop-shadow-sm">
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
