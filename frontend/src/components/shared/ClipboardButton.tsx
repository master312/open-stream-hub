import React, { useState } from "react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface ClipboardButtonProps {
  text: string;
  className?: string;
}

export const ClipboardButton: React.FC<ClipboardButtonProps> = ({
  text,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-content-secondary hover:text-content-primary transition-colors ${className}`}
    >
      {copied ? (
        <CheckIcon className="w-5 h-5" />
      ) : (
        <ClipboardIcon className="w-5 h-5" />
      )}
    </button>
  );
};
