import React, { useEffect, useRef, useState } from "react";
import "./StreamViewer.css";

interface StreamSource {
  label: string;
  url: string;
}

interface StreamViewerProps {
  sources: StreamSource[];
}

const StreamViewer: React.FC<StreamViewerProps> = ({ sources }) => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  // Initiera referenser för varje video
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, sources.length);
  }, [sources.length]);

  // Sätt starttid och spela upp alla videos samtidigt
  const syncVideos = () => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.currentTime = currentTime;
        video.play().catch(() => {}); // Hantera eventuella autoplay-fel
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
      {/* Alla videos, men bara en är synlig och har ljud */}
      <div className="video-container">
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

      {/* Miniatyrknappar för att byta vinkel */}
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
      </div>
    </div>
  );
};

export default StreamViewer;
