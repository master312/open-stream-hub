import React, { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { CircularProgress } from "../shared/CircularProgress";

interface AddStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export const AddStreamModal: React.FC<AddStreamModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return; // Add validation

    setIsLoading(true);
    try {
      await onSubmit(name);
      onClose();
    } catch (error) {
      console.error("Failed to add stream:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Stream">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        onKeyDown={handleKeyDown}
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-content-secondary mb-1"
          >
            Stream Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-background-primary border border-border-primary rounded-lg px-3 py-2
                     text-content-primary focus:outline-none focus:ring-2 focus:ring-content-accent"
            placeholder="Enter stream name"
            required
          />
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            type="button" // Add this to prevent form submission
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center">
                <CircularProgress size={20} />
                <span className="ml-2">Adding...</span>
              </div>
            ) : (
              "Add Stream"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
