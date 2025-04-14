import React, { useState, useRef, useEffect } from "react";
import "./StreamViewer.css"; // Importera CSS-filen

interface StreamSource {
  label: string;         // Namn som visas för källan (t.ex. "Kamera 1")
  url: string;           // URL till videon eller streamen
}

interface StreamViewerProps {
  sources: StreamSource[]; // Lista över tillgängliga videokällor
}

const StreamViewer: React.FC<StreamViewerProps> = ({ sources }) => {
  const [currentSource, setCurrentSource] = useState<StreamSource>(sources[0]);
  const [currentTime, setCurrentTime] = useState(0); // För att spara tidsstämpeln
  const mainVideoRef = useRef<HTMLVideoElement | null>(null); // Referens till huvudvideon

  // Hämta timestamp från localStorage vid sidladdning
  useEffect(() => {
    const savedTime = localStorage.getItem("videoTimestamp");
    if (savedTime) {
      setCurrentTime(parseFloat(savedTime)); // Sätt den sparade tiden
    }
  }, []);

  const handleSourceChange = (source: StreamSource) => {
    if (mainVideoRef.current) {
      // Spara den aktuella tidsstämpeln
      const timestamp = mainVideoRef.current.currentTime;
      setCurrentTime(timestamp);
      localStorage.setItem("videoTimestamp", timestamp.toString()); // Spara i localStorage
    }

    // Byt källa
    setCurrentSource(source);
  };

  const handleLoadedMetadata = () => {
    if (mainVideoRef.current) {
      // Sätt tidsstämpeln på den nya videon
      mainVideoRef.current.currentTime = currentTime;
    }
  };

  const handleTimeUpdate = () => {
    if (mainVideoRef.current) {
      // Uppdatera timestampen i localStorage medan videon spelas
      const timestamp = mainVideoRef.current.currentTime;
      localStorage.setItem("videoTimestamp", timestamp.toString());
    }
  };

  return (
    <div className="stream-viewer">
      {/* Huvudvideospelaren */}
      <video
        className="main-video"
        ref={mainVideoRef} // Koppla referensen till huvudvideon
        src={currentSource.url}
        controls
        autoPlay
        muted
        playsInline
        onLoadedMetadata={handleLoadedMetadata} // När metadata laddas, sätt tidsstämpeln
        onTimeUpdate={handleTimeUpdate} // Uppdatera timestampen kontinuerligt
      />

      {/* Miniatyrfönster för att byta stream */}
      <div className="stream-thumbnails">
        {sources.map((source, index) => (
          <button
            key={index}
            className={`thumbnail-button ${currentSource.url === source.url ? "active" : ""}`}
            onClick={() => handleSourceChange(source)} // Byt källa och spara tidsstämpeln
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