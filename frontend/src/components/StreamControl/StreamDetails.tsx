import React from "react";
import { ClipboardButton } from "../shared/ClipboardButton";
import { Stream } from "../../types/stream";

interface StreamDetailsProps {
  stream: Stream;
}

export const StreamDetails: React.FC<StreamDetailsProps> = ({ stream }) => {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-medium text-content-primary">
        Stream Details
      </h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-content-secondary">
            RTMP Endpoint
          </label>
          <div className="flex mt-1">
            <input
              type="text"
              readOnly
              value={stream.rtmpEndpoint}
              className="flex-1 bg-background-primary border border-border-primary rounded-l-lg px-3 py-2
                       text-content-primary"
            />
            <ClipboardButton
              text={stream.rtmpEndpoint}
              className="bg-background-hover border border-l-0 border-border-primary rounded-r-lg px-3"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-content-secondary">Quality</label>
          <div className="text-content-primary mt-1">{stream.quality}</div>
        </div>
      </div>
    </div>
  );
};
