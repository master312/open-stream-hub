import React, { useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { Stream, StreamDestination, StreamStatus } from "../../types/stream";
import { streamsService } from "../../services/streams.service";
import { toast } from "react-toastify";

interface StreamDestinationsProps {
  stream: Stream;
}

export const StreamDestinations: React.FC<StreamDestinationsProps> = ({
  stream,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] =
    useState<StreamDestination["platform"]>("twitch");

  const isStreamModifiable =
    stream.status === "Stopped" || stream.status === "Error";

  const handleAddDestination = async (formData: FormData) => {
    if (!isStreamModifiable) {
      toast.warning("Can not add new destination while stream is running");
      return;
    }

    const serverUrl = formData.get("serverUrl") as string;
    const streamKey = formData.get("streamKey") as string;

    try {
      await streamsService.addDestination(stream.id, {
        platform: selectedPlatform,
        serverUrl,
        streamKey,
        status: "disconnected",
        enabled: true,
      });

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
                src={`/icons/${dest.platform}.svg`}
                alt={dest.platform}
                className="w-6 h-6"
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
        ))}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Destination"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddDestination(new FormData(e.currentTarget));
          }}
        >
          <div>
            <label className="text-sm text-content-secondary">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) =>
                setSelectedPlatform(
                  e.target.value as StreamDestination["platform"],
                )
              }
              className="w-full bg-background-primary border border-border-primary rounded-lg px-3 py-2
                       text-content-primary mt-1"
            >
              <option value="twitch">Twitch</option>
              <option value="youtube">YouTube</option>
              <option value="custom_rtmp">Custom RTMP</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-content-secondary">Server URL</label>
            <input
              name="serverUrl"
              type="text"
              required
              className="w-full bg-background-primary border border-border-primary rounded-lg px-3 py-2
                       text-content-primary mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-content-secondary">Stream Key</label>
            <input
              name="streamKey"
              type="password"
              required
              className="w-full bg-background-primary border border-border-primary rounded-lg px-3 py-2
                       text-content-primary mt-1"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add destination</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
