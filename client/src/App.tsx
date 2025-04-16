import { useState, useEffect } from "react";
import { SocketProvider } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Login/JoinForm";
import DraggableWrapper from "./components/DraggableWrapper";
import VideoParent from "./components/Video/VideoParent";
import Lobby from "./components/Lobby/Lobby";

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [videoExists, setVideoExists] = useState(false);
    const [roomSelected, setRoomSelected] = useState(false);

    useEffect(() => {
        const storedRoom = localStorage.getItem("chatRoom");
        setRoomSelected(!!storedRoom); // Sätt till true om ett rum är valt
    }, []);

    useEffect(() => {
        const storedName = localStorage.getItem("chatName");
        const storedRoom = localStorage.getItem("chatRoom");
        const storedTicketNumber = localStorage.getItem("ticketNumber");

        // Kontrollera om användaren är inloggad
        if (storedName && storedTicketNumber) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
            setRoomSelected(false); // Återställ till lobbyn om något saknas
        }

        // Kontrollera om huvudvideon finns
        const checkVideoFile = async () => {
            try {
                const response = await fetch("/Malmolive360_Fb360_360-1.mp4");
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
        localStorage.removeItem("chatRoom"); // Ta bort rumsinformationen
        setRoomSelected(false); // Återgå till lobbyn
    };

    const handleRoomSelect = (roomName: string) => {
        localStorage.setItem("chatRoom", roomName);
        setRoomSelected(true); // Markera att ett rum har valts
    };

    const handleLogin = (name: string, ticketNumber: string) => {
        localStorage.setItem("chatName", name);
        localStorage.setItem("ticketNumber", ticketNumber);
        setIsLoggedIn(true); // Markera att användaren är inloggad
    };

    return (
        <SocketProvider>
        {isLoggedIn ? (
            roomSelected ? (
                <>
                    <DraggableWrapper>
                        <ChatApp onLeave={handleLogout} />
                    </DraggableWrapper>
                    {videoExists && <VideoParent />}
                </>
            ) : (
                <Lobby onRoomSelect={handleRoomSelect} />
            )
        ) : (
            <JoinForm onLogin={handleLogin} />
        )}
    </SocketProvider>
    );
};

export default App;