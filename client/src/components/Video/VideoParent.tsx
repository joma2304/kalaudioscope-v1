import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Video360 from "./Video360";
import { useSocket } from "../../context/SocketContext"; // Importera useSocket
import "./VideoParent.css"; // Importera CSS-filen

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const STORAGE_KEY = "lastVideoTime";

const VideoParent = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isController, setIsController] = useState(false);
    const [controllerName, setControllerName] = useState<string | null>(null);  // För att hålla reda på kontrollansvarig användares namn

    // Hämta socket från contexten
    const socket = useSocket();

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

            // Skicka uppdaterad tid till servern
            socket.emit('syncTime', video.currentTime);
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
    }, [isVideoReady, socket]);

    useEffect(() => {
        socket.on('syncTime', (time: number) => {
            const video = videoRef.current;
            if (video && Math.abs(video.currentTime - time) > 0.1) {
                video.currentTime = time;
            }
        });

        socket.on('togglePlayPause', (isPlaying: boolean) => {
            const video = videoRef.current;
            if (video) {
                if (isPlaying && video.paused) {
                    video.play().then(() => setIsPlaying(true)).catch(console.warn);
                } else if (!isPlaying && !video.paused) {
                    video.pause();
                    setIsPlaying(false);
                }
            }
        });

        socket.on('initialState', ({ currentTime, isPlaying, isController }) => {
            const video = videoRef.current;
            if (video) {
                video.currentTime = currentTime;
                setCurrentTime(currentTime);
                setIsPlaying(isPlaying);

                if (isPlaying) {
                    video.play().catch(console.warn);
                } else {
                    video.pause();
                }

                setIsController(isController);
            }
        });

        socket.on('youAreNowController', (username: string) => {
            setControllerName(username);  // Uppdatera namn på kontrollansvarig
            setIsController(true);
        });

        socket.on('youAreNoLongerController', () => {
            setControllerName(null);  // Rensa kontrollansvarig namn
            setIsController(false);
        });

        return () => {
            socket.off('syncTime');
            socket.off('togglePlayPause');
            socket.off('initialState');
            socket.off('youAreNowController');
            socket.off('youAreNoLongerController');
        };
    }, [socket]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.muted = false;
            video.play().then(() => {
                setIsPlaying(true);
                socket.emit('togglePlayPause', true);
            }).catch(console.warn);
        } else {
            video.pause();
            setIsPlaying(false);
            socket.emit('togglePlayPause', false);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        const video = videoRef.current;
        if (video) {
            video.currentTime = newTime;
            setCurrentTime(newTime);
            localStorage.setItem(STORAGE_KEY, newTime.toString());
            socket.emit('syncTime', newTime);
        }
    };


    return (
        <div>
            <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 0, 0.1] }}>
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={true}
                    rotateSpeed={0.5}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                />
                <Video360 videoSrc="/Malmolive360_Fb360_360-1.mp4" videoRef={videoRef} />
            </Canvas>

            <div className="video-controls">
                <div className="time-info">
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    <span className="controller-info">
                    {isController ? "You are in controll" : "You are not in controll"}

                    </span>
                </div>

                {isController && (
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoParent;
