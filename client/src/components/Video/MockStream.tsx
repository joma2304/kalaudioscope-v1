import React, { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import "./MockStream.css";

const MockStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);


  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const hls = new Hls();

      hls.loadSource("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });

      return () => {
        hls.destroy();
      };
    }
  }, []);

  
  return (
    <div className="stream-container">
      <div className="video-player">
        <video ref={videoRef} width="100%" height="auto" controls>
          <source src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" type="application/x-mpegURL"  />
          Your browser does not support the video tag.
        </video>

      </div>
    </div>
  );
};

export default MockStream;
