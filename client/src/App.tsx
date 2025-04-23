import { useState, useEffect } from "react";
import { SocketProvider } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Lobby/JoinForm";
import DraggableWrapper from "./components/DraggableWrapper";
import StreamViewer from "./components/Stream/StreamViewer";
import RoomList from "./components/Lobby/RoomList";

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [videoExists, setVideoExists] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem("chatName");
        const storedRoom = localStorage.getItem("chatRoom");

        if (storedName && storedRoom) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }

        // Kontrollera om huvudvideon finns
        const checkVideoFile = async () => {
            try {
                const response = await fetch("/videos/angle1.mp4");
                if (response.ok && response.headers.get("content-type") !== "text/html") {
                    setVideoExists(true);
                } else {
                    console.log("Video file does not exist.");
                    setVideoExists(false);
                }
            } catch (error) {
                console.error("Error checking video file:", error);
                setVideoExists(false);
            }
        };

        checkVideoFile();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("chatName");
        localStorage.removeItem("chatRoom");
        setIsLoggedIn(false);
    };

    // Tillfälliga testvideor
    const testStreams = [
        { label: "Camera 1", url: "/videos/angle1.mp4" },
        { label: "Camera 2", url: "/videos/angle2.mp4" },
        { label: "Camera 3", url: "/videos/angle3.mp4" },
        { label: "Camera 4", url: "/videos/angle4.mp4" }
    ];

    return (
        <SocketProvider>
            {isLoggedIn ? (
                <>
                    <DraggableWrapper>
                        <ChatApp onLeave={handleLogout} />
                    </DraggableWrapper>
                    {videoExists && <StreamViewer sources={testStreams} />}
                </>
            ) : (<>
                <JoinForm />
                <RoomList  />
                </>
            )}
        </SocketProvider>
    );
};

export default App;
