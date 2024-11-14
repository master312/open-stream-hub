import React, { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { StreamDestination } from "../../types/stream";
import { CircularProgress } from "../shared/CircularProgress";

interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (destination: Omit<StreamDestination, "id">) => Promise<void>;
}

export const AddDestinationModal: React.FC<AddDestinationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedPlatform, setSelectedPlatform] =
    useState<StreamDestination["platform"]>("twitch");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setIsLoading(true);
    try {
      await onSubmit({
        platform: selectedPlatform,
        serverUrl: formData.get("serverUrl") as string,
        streamKey: formData.get("streamKey") as string,
        status: "disconnected",
        enabled: true,
      });
      onClose();
    } catch (error) {
      console.error("Failed to add destination:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Destination">
      <form className="space-y-4" onSubmit={handleSubmit}>
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
                     text-content-primary mt-1 focus:outline-none focus:ring-2 focus:ring-content-accent"
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
                     text-content-primary mt-1 focus:outline-none focus:ring-2 focus:ring-content-accent"
            placeholder="e.g., rtmp://live.twitch.tv/app"
          />
        </div>

        <div>
          <label className="text-sm text-content-secondary">Stream Key</label>
          <input
            name="streamKey"
            type="password"
            required
            className="w-full bg-background-primary border border-border-primary rounded-lg px-3 py-2
                     text-content-primary mt-1 focus:outline-none focus:ring-2 focus:ring-content-accent"
            placeholder="Enter your stream key"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center">
                <CircularProgress size={20} />
                {/* className="mr-2"  */}
                Adding...
              </div>
            ) : (
              "Add Destination"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
