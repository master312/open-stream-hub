import React from "react";

interface CircularProgressProps {
  size?: number;
  thickness?: number;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 24,
  thickness = 4,
  color = "currentColor",
}) => {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        fill="none"
        strokeWidth={thickness}
      />
      <circle
        className="opacity-75"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        fill="none"
        strokeWidth={thickness}
        strokeDasharray={62.83}
        strokeDashoffset={15.71}
      />
    </svg>
  );
};
