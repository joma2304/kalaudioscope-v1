import React, { useEffect } from "react";
import { useVideoTexture } from "@react-three/drei";

interface Video360Props {
    videoSrc: string;
    videoRef: React.MutableRefObject<HTMLVideoElement | null>;
}

const Video360: React.FC<Video360Props> = ({ videoSrc, videoRef }) => {
    const videoTexture = useVideoTexture(videoSrc, {
        loop: true,
        muted: true,
        autoplay: true,
        crossOrigin: "anonymous",
    });

    useEffect(() => {
        if (videoRef && videoTexture?.image instanceof HTMLVideoElement) {
            videoRef.current = videoTexture.image;
        } else {
            console.error("Failed to load video texture.");
        }
    }, [videoTexture, videoRef]);

    return (
        <mesh scale={[-1, 1, 1]}>
            <sphereGeometry args={[500, 60, 40]} />
            <meshBasicMaterial map={videoTexture} side={2} />
        </mesh>
    );
};

export default Video360;