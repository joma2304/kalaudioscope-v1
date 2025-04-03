import React from "react";
import { useVideoTexture } from "@react-three/drei";

interface Video360Props {
    videoSrc: string; // URL till 360-videon
}

const Video360: React.FC<Video360Props> = ({ videoSrc }) => {
    const videoTexture = useVideoTexture(videoSrc); // Skapar en videotekstur från källan

    return (

            <mesh>
                {/* Skapar en sfär för att visa 360-videon */}
                <sphereGeometry args={[500, 60, 40]} />
                <meshBasicMaterial map={videoTexture} side={2} />
            </mesh>
    );
};

export default Video360;

