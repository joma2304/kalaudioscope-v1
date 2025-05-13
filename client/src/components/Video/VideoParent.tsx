import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Video360 from "./Video360";
import "./VideoParent.css";

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const STORAGE_KEY = "lastVideoTime";
const STREAMS_KEY = "customStreams";
const DEFAULT_360_URL = "/Malmolive360_Fb360_360-1.mp4";

interface VideoParentProps {
    onToggleViewMode: () => void;
    isVideoParent: boolean;
}

const VideoParent: React.FC<VideoParentProps> = ({ onToggleViewMode, isVideoParent }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [videoUrl, setVideoUrl] = useState(DEFAULT_360_URL);

    // Hämta rätt 360°-källa från localStorage eller default
    useEffect(() => {
        const updateUrl = () => {
            const saved = localStorage.getItem(STREAMS_KEY);
            if (saved) {
                try {
                    const arr = JSON.parse(saved);
                    const found = arr.find((s: any) => s.label === "360°");
                    setVideoUrl(found?.url || DEFAULT_360_URL);
                } catch {
                    setVideoUrl(DEFAULT_360_URL);
                }
            } else {
                setVideoUrl(DEFAULT_360_URL);
            }
        };
        updateUrl();
        window.addEventListener("customStreamsChanged", updateUrl);
        return () => window.removeEventListener("customStreamsChanged", updateUrl);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const video = videoRef.current;
            if (video && video.readyState >= 1 && !isVideoReady) {
                setIsVideoReady(true);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isVideoReady]);

    useEffect(() => {
        if (!isVideoReady || !videoRef.current) return;
        const video = videoRef.current;

        const savedTime = parseFloat(localStorage.getItem(STORAGE_KEY) || "0");

        const updateTime = () => {
            setCurrentTime(video.currentTime);
            localStorage.setItem(STORAGE_KEY, video.currentTime.toString());
        };

        const updateMeta = () => {
            setDuration(video.duration);
            if (!isNaN(savedTime) && savedTime < video.duration) {
                video.currentTime = savedTime;
                setCurrentTime(savedTime);
            } else {
                video.currentTime = 0;
            }
        };

        video.addEventListener("loadedmetadata", updateMeta);
        video.addEventListener("timeupdate", updateTime);

        if (video.readyState >= 1) {
            updateMeta();
        }

        setIsPlaying(!video.paused);

        return () => {
            video.removeEventListener("loadedmetadata", updateMeta);
            video.removeEventListener("timeupdate", updateTime);
        };
    }, [isVideoReady]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.muted = false;
            video.play().then(() => {
                setIsPlaying(true);
            }).catch(console.warn);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        const video = videoRef.current;
        if (video) {
            video.currentTime = newTime;
            setCurrentTime(newTime);
            localStorage.setItem(STORAGE_KEY, newTime.toString());
        }
    };

    return (
        <div className="video-parent">
            <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 0, 0.1] }}>
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={true}
                    rotateSpeed={0.5}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                />
                <Video360 videoSrc={videoUrl} videoRef={videoRef} />
            </Canvas>

            <div className="video-controls">
                <div className="time-info">
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>

                <div className="controller-actions">
                    <button className="controller-button" onClick={togglePlay} style={{ padding: "5px 10px" }}>
                        {isPlaying ? "⏸ Pause" : "▶ Play"}
                    </button>

                    <input
                        className="seek-bar"
                        type="range"
                        min={0}
                        max={duration || 0}
                        step={0.1}
                        value={currentTime}
                        onChange={handleSeek}
                        style={{ flexGrow: 1 }}
                    />

                    {/* Knapp för att byta vy */}
                    <button
                        className="controller-button"
                        onClick={onToggleViewMode}
                        style={{ padding: "5px 10px" }}
                    >
                        {isVideoParent ? "Switch to stream" : "Switch to 360 stream"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoParent;