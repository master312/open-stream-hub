import React, { useState } from "react";
import {
  PlusIcon,
  XMarkIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../shared/Button";
import { Stream, StreamDestination, StreamStatus } from "../../types/stream";
import { AddDestinationModal } from "./AddDestinationModal";
import { StreamDestinationDetailsModal } from "./StreamDestinationDetailsModal";

import { streamsService } from "../../services/streams.service";
import { toast } from "react-toastify";

interface StreamDestinationsProps {
  stream: Stream;
}

export const StreamDestinations: React.FC<StreamDestinationsProps> = ({
  stream,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] =
    useState<StreamDestination | null>(null);

  const isStreamModifiable =
    stream.status === "Stopped" || stream.status === "Error";

  const handleAddDestination = async (
    destination: Omit<StreamDestination, "id">,
  ) => {
    if (!isStreamModifiable) {
      toast.warning("Can not add new destination while stream is running");
      return;
    }

    try {
      await streamsService.addDestination(stream.id, destination);
      toast.success("Destination added successfully");
      setIsAddModalOpen(false);
    } catch (error) {
      toast.error(
        `Failed to add destination: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleRemoveDestination = async (destinationId: string) => {
    if (!isStreamModifiable) {
      toast.warning("Stream must be stopped in order to perform this action");
      return;
    }

    try {
      await streamsService.removeDestination(stream.id, destinationId);
      toast.success("Destination removed successfully");
    } catch (error) {
      toast.error(
        `Failed to remove destination: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleAddClick = () => {
    if (!isStreamModifiable) {
      toast.warning("Can not add new destination while stream is running");
      return;
    }
    setIsAddModalOpen(true);
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-content-primary">
          Destinations
        </h2>
        <Button variant="secondary" onClick={handleAddClick}>
          <PlusIcon className="w-5 h-5 mr-2" />
          <span className="text-content-secondary">Add destination</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stream.destinations.map((dest) => (
          <div
            key={dest.id}
            className="flex items-center justify-between p-4 bg-background-hover rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <img
                src={`/icons/${dest.platform}.png`}
                alt={dest.platform}
                className="w-8 h-8"
              />
              <div>
                <div className="text-content-primary font-medium">
                  {dest.platform}
                </div>
                <div className="text-content-secondary text-sm truncate max-w-xs">
                  {dest.serverUrl}
                </div>
                <div className="text-content-secondary text-sm">
                  Status: {dest.status}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedDestination(dest)}
                className="text-content-secondary hover:text-content-primary transition-colors"
                title="Show details"
              >
                <InformationCircleIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleRemoveDestination(dest.id)}
                disabled={!isStreamModifiable}
                className={`text-content-secondary transition-colors ${
                  isStreamModifiable
                    ? "hover:text-status-error"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddDestinationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDestination}
      />

      {selectedDestination && (
        <StreamDestinationDetailsModal
          isOpen={!!selectedDestination}
          onClose={() => setSelectedDestination(null)}
          destination={selectedDestination}
        />
      )}
    </div>
  );
};
