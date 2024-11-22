import React from "react";
import { cn } from "../../lib/utils";
import { StreamStatus } from "../../types/stream";

interface StatusBadgeProps {
  state: StreamStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  state,
  className,
}) => {
  return (
    <div
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium",
        {
          "bg-status-success bg-opacity-65 text-red-600 border-2 border-status-success border-opacity-100 shadow-sm":
            state === "Live",
          "bg-content-secondary bg-opacity-65 text-content-primary border border-content-secondary border-opacity-100":
            state === "Stopped",
          "bg-yellow-500/20 text-yellow-600 border-2 border-yellow-500 shadow-sm":
            state === "Waiting",
        },
        className,
      )}
    >
      <div className="flex items-center space-x-1.5">
        {state === "Live" && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-glow" />
        )}
        {state === "Waiting" && (
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-glow" />
        )}
        <span className="font-bold tracking-wide drop-shadow-sm">
          {state.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
