import React, { useEffect, useRef, useState } from "react";
import VideoParent from "../Video/VideoParent";
import { useSocket } from "../../context/SocketContext";
import "./StreamViewer.css";

interface StreamSource {
  label: string;
  url: string;
}

interface StreamViewerProps {
  sources: StreamSource[];
  userId: string; // Lägg till userId som en prop
}

const StreamViewer: React.FC<StreamViewerProps> = ({ sources, userId }) => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showVideoParent, setShowVideoParent] = useState(false); // Ny state för att växla mellan StreamViewer och VideoParent
  const [isController, setIsController] = useState(false); // Ny state för att kontrollera om användaren har kontrollen
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  const socket = useSocket();

  // Initiera referenser för varje video
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, sources.length);
  }, [sources.length]);

  // Hämta kontrollstatus från servern
  useEffect(() => {
    socket.on("youAreNowController", () => {
      setIsController(true);
    });

    socket.on("youAreNoLongerController", () => {
      setIsController(false);
    });

    // Lyssna på vyändringar från servern
    socket.on("viewModeChanged", (isVideoParent: boolean) => {
      setShowVideoParent(isVideoParent);
    });

    // Fråga servern om initial kontrollstatus
    console.log("Sending getControllerStatus with userId:", userId);
    socket.emit("getControllerStatus", { userId });

    return () => {
      socket.off("youAreNowController");
      socket.off("youAreNoLongerController");
      socket.off("viewModeChanged");
    };
  }, [socket, userId]);

  useEffect(() => {
    socket.on('syncTime', (time: number) => {
      const activeVideo = videoRefs.current[currentSourceIndex];
      if (activeVideo && Math.abs(activeVideo.currentTime - time) > 0.1) {
        activeVideo.currentTime = time; // Synkronisera tiden
      }
    });

    return () => {
      socket.off('syncTime');
    };
  }, [socket, currentSourceIndex]);

  useEffect(() => {
    socket.on('togglePlayPause', (isPlaying: boolean) => {
      const activeVideo = videoRefs.current[currentSourceIndex];
      if (activeVideo) {
        if (isPlaying && activeVideo.paused) {
          activeVideo.play().catch(console.warn);
        } else if (!isPlaying && !activeVideo.paused) {
          activeVideo.pause();
        }
      }
    });

    return () => {
      socket.off('togglePlayPause');
    };
  }, [socket, currentSourceIndex]);

  // Byt vy och meddela servern
  const toggleViewMode = () => {
    const newViewMode = !showVideoParent;
    setShowVideoParent(newViewMode);
    socket.emit("toggleViewMode", { userId, isVideoParent: newViewMode }); // Skicka ny vy till servern
  };

  // Synka alla videos när de är laddade
  const syncVideos = () => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.currentTime = currentTime;
        video.play().catch(() => { }); // Hantera eventuella autoplay-fel
      }
    });
  };

  // Hämta tidigare tid från localStorage
  useEffect(() => {
    const savedTime = localStorage.getItem("videoTimestamp");
    if (savedTime) {
      setCurrentTime(parseFloat(savedTime));
    }
  }, []);

  // Synka alla videos när de är laddade
  useEffect(() => {
    if (isReady) {
      syncVideos();
    }
  }, [isReady]);

  // Uppdatera timestamp kontinuerligt från aktiv video
  const handleTimeUpdate = () => {
    const activeVideo = videoRefs.current[currentSourceIndex];
    if (activeVideo) {
      const time = activeVideo.currentTime;
      setCurrentTime(time);
      localStorage.setItem("videoTimestamp", time.toString());
    }
  };

  // Kontrollera när alla videos är redo
  const handleLoadedMetadata = () => {
    const allReady = videoRefs.current.every((video) => video?.readyState >= 1);
    if (allReady) setIsReady(true);
  };

  // Byt videokälla
  const switchSource = async (newIndex: number) => {
    const activeVideo = videoRefs.current[currentSourceIndex];
    const newVideo = videoRefs.current[newIndex];

    if (!activeVideo || !newVideo) return;

    const time = activeVideo.currentTime;
    setCurrentTime(time);
    localStorage.setItem("videoTimestamp", time.toString());

    // Sätt nya videons tid och spela i bakgrunden
    try {
      newVideo.currentTime = time;

      // Vänta tills videon är redo att spela (buffrat)
      const playPromise = newVideo.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      // Vänta lite extra för säkerhets skull
      setTimeout(() => {
        setCurrentSourceIndex(newIndex);
      }, 100); // justerbar delay
    } catch (err) {
      console.error("Kunde inte spela upp ny video:", err);
    }
  };

  return (
    <div className="stream-viewer">
      {showVideoParent ? (
        <VideoParent
          onToggleViewMode={toggleViewMode}
          isVideoParent={showVideoParent}
          isController={isController} // Behåll denna prop om den används för andra ändamål
        />
      ) : (
        <>
          {/* Vinklarna */}
          <div className="stream-thumbnails">
            {sources.map((source, index) => (
              <button
                key={index}
                className={`thumbnail-button ${currentSourceIndex === index ? "active" : ""}`}
                onClick={() => switchSource(index)}
              >
                <video
                  className="thumbnail-video"
                  src={source.url}
                  muted
                  playsInline
                  preload="metadata"
                />
                <span className="label">{source.label}</span>
              </button>
            ))}

            {/* Knapp för att byta vy */}
            <button
              onClick={toggleViewMode}
              className="toggle-view-button"
            >
              {showVideoParent ? "Switch to stream" : "Switch to 360° stream"}
            </button>
          </div>

          {/* Huvudvideon */}
          <div className="main-video-container">
            {sources.map((source, index) => (
              <video
                key={index}
                ref={(el) => {
                  if (el) {
                    videoRefs.current[index] = el;
                  }
                }}
                src={source.url}
                className={`main-video ${index === currentSourceIndex ? "visible" : "hidden"}`}
                muted={index !== currentSourceIndex}
                controls={index === currentSourceIndex}
                autoPlay
                playsInline
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={index === currentSourceIndex ? handleTimeUpdate : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StreamViewer;
