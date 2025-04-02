import React, { useState, useEffect, useRef } from "react";
import "./MockStream.css";

const MockStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);


  return (
    <div className="stream-container">
      <div className="video-player">
        <video ref={videoRef} width="100%" height="auto" controls>
          <source src="your-video-source.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

      </div>
    </div>
  );
};

export default MockStream;
