import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { streamsService } from "../../services/streams.service";
import { Button } from "../shared/Button";
import { StreamDetails } from "./StreamDetails";
import { StreamDestinations } from "./StreamDestinations";
import { StreamAnalytics } from "./StreamAnalytics";
import { CircularProgress } from "../shared/CircularProgress";
import { StreamInstance, StreamStatus } from "../../types/stream";
import { toast } from "react-toastify";
import { TrashIcon, StopIcon, PlayIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Modal } from "../shared/Modal";

export const StreamControlView: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const [stream, setStream] = useState<StreamInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!streamId) return;

    let pollingInterval: NodeJS.Timeout;

    // Inner function to handle fetch errors consistently
    const fetchStream = async () => {
      try {
        await streamsService.fetchStreamById(streamId);
      } catch (error) {
        console.error("Failed to fetch stream:", error);
        // Only show toast for initial load errors, not polling errors
        if (!pollingInterval) {
          toast.error(`Failed to fetch stream: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    };

    const subscriptions = [
      streamsService.currentStream$.subscribe(setStream),
      streamsService.loading$.subscribe(setLoading),
      streamsService.error$.subscribe(setError),
    ];

    // Initial fetch
    fetchStream();

    // Set up polling
    pollingInterval = setInterval(() => {
      fetchStream();
    }, 5000); // Match the polling interval from streams.service

    return () => {
      // Clear all
      subscriptions.forEach((sub) => sub.unsubscribe());
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [streamId]); // Only re-run if streamId changes

  const handleStreamAction = async <T,>(action: () => Promise<T>, successMessage: string, errorPrefix: string) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `${errorPrefix}`;
      toast.error(errorMessage);
    }
  };

  const handleStart = () => {
    if (!streamId || !stream) return;
    handleStreamAction(() => streamsService.startStream(streamId), "Stream started successfully", "Failed to start stream");
  };

  const handleStop = () => {
    if (!streamId || !stream) return;
    handleStreamAction(() => streamsService.stopStream(streamId), "Stream stopped successfully", "Failed to stop stream");
  };

  const handleDelete = async () => {
    if (!streamId || !stream) return;
    if (stream.state !== "Stopped") {
      toast.error("Stream must be stopped before it can be deleted");
      return;
    }
    handleStreamAction(
      async () => {
        await streamsService.removeStream(streamId);
        navigate("/");
      },
      "Stream deleted successfully",
      "Failed to delete stream",
    );
  };

  const getStreamActionState = (state: StreamStatus) => {
    const states = {
      Live: {
        canStart: false,
        canStop: true,
        canDelete: false,
        showStopButton: true,
      },
      Waiting: {
        canStart: false,
        canStop: true,
        canDelete: false,
        showStopButton: true,
      },
      Error: {
        canStart: true,
        canStop: false,
        canDelete: false,
        showStopButton: false,
      },
      Stopped: {
        canStart: true,
        canStop: false,
        canDelete: true,
        showStopButton: false,
      },
    };

    return states[state];
  };

  const renderStreamControls = () => {
    if (!stream) return null;

    const actionState = getStreamActionState(stream.state);

    const handleDeleteClick = () => {
      if (stream.state !== "Stopped") {
        toast.error("Stream must be stopped before it can be deleted");
        return;
      }
      setIsDeleteModalOpen(true);
    };

    return (
      <div className="flex space-x-4">
        {actionState.showStopButton ? (
          <Button variant="secondary" className="text-status-error hover:bg-status-error hover:bg-opacity-10" onClick={handleStop}>
            <StopIcon className="w-5 h-5 mr-2" />
            Stop Stream
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="text-status-success hover:bg-status-success hover:bg-opacity-10"
            onClick={handleStart}
            disabled={!actionState.canStart}
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Start Stream
          </Button>
        )}
        <Button
          variant="secondary"
          className="text-status-error hover:bg-status-error hover:bg-opacity-10"
          onClick={handleDeleteClick}
        >
          <TrashIcon className="w-5 h-5 mr-2" />
          Delete Stream
        </Button>
      </div>
    );
  };

  if (loading && !stream) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress size={40} />
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-background-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-content-primary">{error?.message || "Stream not found"}</h1>
            <Button className="mt-4" onClick={() => navigate("/")}>
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 bg-background-secondary hover:bg-background-hover px-4 rounded-lg"
            >
              <ArrowLeftIcon className="w-5 h-5 text-content-secondary" />
              <span className="text-content-secondary">Back to Streams</span>
            </Button>
            <div className="border-l border-border-primary h-8 mx-2" />
            <div>
              <h1 className="text-2xl font-semibold text-content-primary">{stream.name}</h1>
              <p className="text-content-secondary">Stream Configuration</p>
            </div>
          </div>
          {renderStreamControls()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <StreamDetails stream={stream} />
            <StreamDestinations stream={stream} />
          </div>

          <div>
            <StreamAnalytics
              analytics={{
                runtime: "00:00:00",
                viewers: 0,
                bandwidth: "0 Mbps",
                cpuUsage: 0,
                viewerHistory: [],
              }}
            />
          </div>
        </div>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Stream">
        <div className="space-y-4">
          <p className="text-content-primary">Are you sure you want to delete this stream? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="text-status-error hover:bg-status-error hover:bg-opacity-10"
              onClick={handleDelete}
            >
              Delete Stream
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
