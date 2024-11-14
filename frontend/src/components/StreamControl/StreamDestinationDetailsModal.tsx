import React, { useState } from "react";
import { Modal } from "../shared/Modal";
import { StreamDestination } from "../../types/stream";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface StreamDestinationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: StreamDestination;
}

export const StreamDestinationDetailsModal: React.FC<
  StreamDestinationDetailsModalProps
> = ({ isOpen, onClose, destination }) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Destination Details">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-content-secondary">Platform</label>
          <p className="text-content-primary font-medium">
            {destination.platform}
          </p>
        </div>
        <div>
          <label className="text-sm text-content-secondary">Server URL</label>
          <p className="text-content-primary font-medium">
            {destination.serverUrl}
          </p>
        </div>
        <div>
          <label className="text-sm text-content-secondary">Stream Key</label>
          <div className="flex items-center gap-2">
            <p className="text-content-primary font-medium">
              {destination.streamKey
                ? showKey
                  ? destination.streamKey
                  : "••••••••"
                : "Not set"}
            </p>
            {destination.streamKey && (
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-1 hover:bg-gray-100 rounded-full"
                title={showKey ? "Hide stream key" : "Show stream key"}
              >
                {showKey ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm text-content-secondary">Status</label>
          <p className="text-content-primary font-medium">
            {destination.status}
          </p>
        </div>
      </div>
    </Modal>
  );
};
