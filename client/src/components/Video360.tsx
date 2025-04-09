import React from "react";
import { useVideoTexture } from "@react-three/drei";

interface Video360Props {
    videoSrc: string; // "/videon.mp4", alltså från public-mappen
}

const Video360: React.FC<Video360Props> = ({ videoSrc }) => {
    // Skapa videotekstur från källan
    const videoTexture = useVideoTexture(videoSrc, {
        loop: true,
        muted: false,
        autoplay: true,
        crossOrigin: "anonymous", // Viktigt om man kör från public
    });

    return (
        <mesh scale={[-1, 1, 1]}>
            {/* Sfären inverteras med scale för att visa insidan */}
            <sphereGeometry args={[500, 60, 40]} />
            <meshBasicMaterial map={videoTexture} side={2} />
        </mesh>
    );
};

export default Video360;

