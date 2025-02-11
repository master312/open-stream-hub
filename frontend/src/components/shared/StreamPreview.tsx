import React from "react";
import { StreamInstance } from "../../types/stream";
import { streamsService } from "../../services/streams.service";
import HLSPlayer from "./HLSPlayer";

interface StreamPreviewProps {
  stream: StreamInstance;
  className?: string;
  disabled?: boolean;
}

export const StreamPreview: React.FC<StreamPreviewProps> = ({ stream, className = "", disabled = false }) => {
  if (disabled) {
    return (
      <div className={`bg-background-primary flex items-center justify-center ${className}`}>
        <span className="text-content-secondary">Preview disabled</span>
      </div>
    );
  }

  const previewUrl = streamsService.getStreamPriviewOrPlaceholder(stream);

  if (stream.state === "Live") {
    return <HLSPlayer src={previewUrl} className={className} muted autoPlay />;
  }

  if (previewUrl.toLowerCase().endsWith(".mp4")) {
    return <video src={previewUrl} className={className} muted loop autoPlay playsInline />;
  }

  return <img src={previewUrl} alt={stream.name} className={className} />;
};
