import React from "react";
import { ClassValue } from "clsx";
import { cn } from "../../lib/utils.ts"; // We'll need to create this utility

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: ClassValue;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content-accent",
        {
          "bg-content-accent text-content-primary hover:bg-opacity-90":
            variant === "primary",
          "bg-background-secondary text-content-primary hover:bg-background-hover":
            variant === "secondary",
          "hover:bg-background-hover": variant === "ghost",
        },
        {
          "h-8 px-3 text-sm": size === "sm",
          "h-10 px-4 text-base": size === "md",
          "h-12 px-6 text-lg": size === "lg",
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
