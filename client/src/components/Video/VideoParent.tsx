import { Canvas } from '@react-three/fiber';
import Video360 from "./Video360"; // Importera Video360-komponenten 
import { OrbitControls } from "@react-three/drei";

const VideoParent = () => {
    return (
        <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 0, 0.1] }}>
            {/* OrbitControls för att möjliggöra interaktivitet */}
            <OrbitControls
                enableZoom={false}
                enablePan={false}
                enableRotate={true}
                rotateSpeed={0.5}
                keyPanSpeed={0.5}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.5}
            />
            <Video360 videoSrc="/Malmolive360_Fb360_360-1.mp4" />
        </Canvas>
    )
}

export default VideoParent