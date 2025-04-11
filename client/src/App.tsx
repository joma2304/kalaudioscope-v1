import { useState, useEffect } from "react";
import { SocketProvider } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Login/JoinForm";
import VideoParent from "./components/Video/VideoParent";
import DraggableWrapper from "./components/DraggableWrapper";

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [videoExists, setVideoExists] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem("chatName");
        const storedRoom = localStorage.getItem("chatRoom");
        const storedTicketNumber = localStorage.getItem("ticketNumber");

        if (storedName && storedRoom && storedTicketNumber) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }

        // Kontrollera om mp4-filen finns
        const checkVideoFile = async () => {
            try {
                const response = await fetch("/Malmolive360_Fb360_360-1.mp4"); // Ändra sökvägen om filen har ett annat namn
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
        localStorage.removeItem("ticketNumber");
        setIsLoggedIn(false);
    };

    return (
        <SocketProvider>
            {isLoggedIn ? (
                <>
                    <DraggableWrapper>
                        <ChatApp onLeave={handleLogout} />
                    </DraggableWrapper>
                    {videoExists && <VideoParent />} {/* Rendera endast om videon finns */}
                </>
            ) : (
                <JoinForm />
            )}
        </SocketProvider>
    );
};

export default App;