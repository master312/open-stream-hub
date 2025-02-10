import React, { useState, useEffect } from "react";
import { StatusBadge } from "../shared/StatusBadge";
import { SignalIcon, ArrowPathIcon, GlobeAltIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { StreamInstance } from "../../types/stream.ts";
import { streamsService } from "../../services/streams.service";

interface StreamCardProps {
  stream: StreamInstance;
  onClick: (streamId: string) => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, onClick }) => {
  const [copied, setCopied] = useState(false);
  const [thumbnailRefresh, setThumbnailRefresh] = useState(0);

  useEffect(() => {
    if (stream.state === "Live") {
      const interval = setInterval(() => {
        setThumbnailRefresh((prev) => prev + 1);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [stream.state]);

  const handleClick = () => {
    onClick(stream.id);
  };

  const copyRtmpEndpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(streamsService.getFullPublicInjestUrl() + "/" + stream.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStreamDuration = () => {
    if (!stream.startedAt) return null;
    const start = new Date(stream.startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const priviewUrl = `${streamsService.getStreamPriviewOrPlaceholder(stream)}`;
  const isVideoUrl = (url: string) => {
    return url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".webm");
    // return url.toLowerCase().startsWith("rtmp");
  };

  const renderMedia = () => {
    if (isVideoUrl(priviewUrl)) {
      return (
        <video
          key={thumbnailRefresh}
          src={priviewUrl}
          className="w-full h-full object-cover rounded-t-lg"
          muted
          loop
          autoPlay
          playsInline
        />
      );
    }

    return <img key={thumbnailRefresh} src={priviewUrl} alt={stream.name} className="w-full h-full object-cover rounded-t-lg" />;
  };

  return (
    <div className="card card-hover cursor-pointer" onClick={handleClick}>
      <div className="relative aspect-video">
        {renderMedia()}
        {/* Edit overlay only on thumbnail */}
        <div
          className="absolute inset-0 bg-background-primary/75 opacity-0 hover:opacity-100
                    transition-opacity duration-200 flex items-center justify-center rounded-t-lg"
        >
          <span className="text-content-primary text-lg font-medium">Edit</span>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge state={stream.state} />
        </div>
        {stream.state === "Live" && stream.startedAt && (
          <div className="absolute bottom-3 right-3 bg-background-primary/75 px-2 py-1 rounded">
            <span className="text-content-primary text-sm">{getStreamDuration()}</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <h3 className="font-medium text-lg text-content-primary truncate">{stream.name}</h3>

        <div className="space-y-2">
          <div className="flex items-start text-sm text-content-secondary group cursor-pointer" onClick={copyRtmpEndpoint}>
            <SignalIcon className="w-4 h-4 mr-2 flex-shrink-0 mt-1" />
            <textarea
              readOnly
              value={
                streamsService.getFullPublicInjestUrl() + "/" + stream.apiKey + "?secret=" + streamsService.getPublicInjectSecret()
              }
              className="resize-none bg-transparent border-none outline-none text-content-secondary w-full cursor-pointer overflow-wrap-anywhere"
              onClick={(e) => e.stopPropagation()}
              rows={2}
              style={{
                overflowWrap: "break-word",
                wordBreak: "break-all",
              }}
            />
            <ClipboardDocumentIcon className="w-4 h-4 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 mt-1" />
            {copied && <span className="ml-2 text-xs text-green-500">Copied!</span>}
          </div>
          <div className="flex items-center text-sm text-content-secondary">
            <ArrowPathIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{"TODO QUALITY HERE"}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {stream.destinations.map((destination, index) => (
              <div
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md
                           bg-background-hover text-xs font-medium text-content-secondary"
              >
                <GlobeAltIcon className="w-3 h-3 mr-1" />
                {destination.platform}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
