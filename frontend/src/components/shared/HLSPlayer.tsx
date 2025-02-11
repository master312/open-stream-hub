import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

interface HLSPlayerProps {
  src: string;
  className?: string;
  muted?: boolean;
  autoPlay?: boolean;
  maxRetries?: number;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ src, className, muted = true, autoPlay = true, maxRetries = 4 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);

  const initializeHLS = () => {
    if (!videoRef.current) return;

    if (Hls.isSupported()) {
      // Destroy existing HLS instance if it exists
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        liveDurationInfinity: true,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 5,
      });

      hlsRef.current = hls;

      // Error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Network error, attempting to recover...");
              if (retryCountRef.current < maxRetries) {
                retryCountRef.current += 1;
                console.log(`Retry attempt ${retryCountRef.current} of ${maxRetries}`);
                setTimeout(() => {
                  hls.loadSource(src);
                  hls.startLoad();
                }, 2000 * retryCountRef.current); // Progressive delay
              } else {
                console.error("Max retries reached, playback failed");
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Media error, attempting to recover...");
              hls.recoverMediaError();
              break;
            default:
              // Cannot recover
              console.error("Fatal error, destroying HLS instance");
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          videoRef.current?.play().catch(console.error);
        }
      });

      // Reset retry counter on successful load
      hls.on(Hls.Events.LEVEL_LOADED, () => {
        retryCountRef.current = 0;
      });

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari
      videoRef.current.src = src;
      if (autoPlay) {
        videoRef.current.play().catch((error) => {
          console.error("Playback failed:", error);
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            setTimeout(() => {
              videoRef.current?.load();
              videoRef.current?.play().catch(console.error);
            }, 1000 * retryCountRef.current);
          }
        });
      }
    }
  };

  useEffect(() => {
    retryCountRef.current = 0; // Reset retry counter when source changes
    initializeHLS();
  }, [src, autoPlay]);

  return <video ref={videoRef} className={className} muted={muted} playsInline controls={false} />;
};

export default HLSPlayer;
