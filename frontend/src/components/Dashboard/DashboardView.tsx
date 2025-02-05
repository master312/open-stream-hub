import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StreamCard } from "./StreamCard";
import { Button } from "../shared/Button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { AddStreamModal } from "./AddStreamModal";
import { streamsService } from "../../services/streams.service";
import { CircularProgress } from "../shared/CircularProgress";
import { StreamInstance } from "../../types/stream";
import { toast } from "react-toastify";

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [streams, setStreams] = useState<StreamInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const subscription = streamsService.streams$.subscribe(setStreams);
    // const loadingSubscription = streamsService.loading$.subscribe(setLoading);
    // const errorSubscription = streamsService.error$.subscribe(setError);

    streamsService.fetchStreams().catch((error) => {
      toast.error(`Failed to fetch streams: ${error.message}`);
    });

    return () => {
      subscription.unsubscribe();
      // loadingSubscription.unsubscribe();
      // errorSubscription.unsubscribe();
    };
  }, []);

  const handleStreamClick = (streamId: string) => {
    navigate(`/stream/${streamId}`);
  };

  const handleAddStream = async (name: string) => {
    try {
      await streamsService.createStream({ name });
      setIsAddModalOpen(false);
      toast.success("Stream created successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create stream";
      toast.error(errorMessage);
    }
  };

  if (loading && streams.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-content-primary">Streams</h1>
            <p className="mt-1 text-sm text-content-secondary">Manage your active streaming endpoints</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Stream
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-status-error bg-opacity-10 border border-status-error rounded-lg text-status-error">
            {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={{
                ...stream,
                name: stream.name,
                destinations: stream.destinations || [],
              }}
              onClick={handleStreamClick}
            />
          ))}
        </div>

        <AddStreamModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddStream} />
      </div>
    </div>
  );
};
