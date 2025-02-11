import React, { useState } from "react";
import { ClipboardButton } from "../shared/ClipboardButton";
import { StreamInstance } from "../../types/stream";
import { streamsService } from "../../services/streams.service";
import { StatusBadge } from "../shared/StatusBadge";
import { Button } from "../shared/Button";
import HLSPlayer from "../shared/HLSPlayer";
import { StreamPreview } from "../shared/StreamPreview";

interface StreamDetailsProps {
  stream: StreamInstance;
}

export const StreamDetails: React.FC<StreamDetailsProps> = ({ stream }) => {
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const togglePreview = () => {
    setPreviewEnabled(!previewEnabled);
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-medium text-content-primary mb-4">Stream Details</h2>

      <div className="flex">
        {/* Left side - RTMP and API Key */}
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm text-content-secondary">RTMP Endpoint</label>
            <div className="flex mt-1">
              <input
                type="text"
                readOnly
                value={streamsService.getFullPublicInjestUrl()}
                className="flex-1 bg-background-primary border border-border-primary rounded-l-lg px-3 py-2
                         text-content-primary"
              />
              <ClipboardButton
                text={streamsService.getFullPublicInjestUrl()}
                className="bg-background-hover border border-l-0 border-border-primary rounded-r-lg px-3"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-content-secondary">API Key</label>
            <div className="flex mt-1">
              <input
                type="text"
                readOnly
                value={stream.apiKey}
                className="flex-1 bg-background-primary border border-border-primary rounded-l-lg px-3 py-2
                         text-content-primary"
              />
              <ClipboardButton
                text={stream.apiKey}
                className="bg-background-hover border border-l-0 border-border-primary rounded-r-lg px-3"
              />
            </div>
          </div>
        </div>

        {/* Right side - Status */}
        <div className="ml-8 flex flex-col items-center justify-center">
          <span className="text-sm text-content-secondary mb-2">Status</span>
          <StatusBadge state={stream.state} className="text-base px-6 py-2" />
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-6">
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-content-secondary">Preview</h3>
            <Button variant="secondary" size="sm" onClick={togglePreview}>
              {previewEnabled ? "Disable Preview" : "Enable Preview"}
            </Button>
          </div>
          <StreamPreview stream={stream} className="w-full aspect-video object-cover" disabled={!previewEnabled} />
        </div>
      </div>
    </div>
  );
};
