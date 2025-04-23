import { useState, useEffect } from "react";
import { SocketProvider, useSocket } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Lobby/JoinForm";
import DraggableWrapper from "./components/DraggableWrapper";
import RoomList from "./components/Lobby/RoomList";
import VideoParent from "./components/Video/VideoParent";


const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [videoExists, setVideoExists] = useState(false);
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [name, setName] = useState(""); // Nytt state för användarnamnet
    const socket = useSocket();

    useEffect(() => {
        const storedName = localStorage.getItem("chatName");
        const storedRoom = localStorage.getItem("chatRoom");
        

        if (storedName && storedRoom) {
            setIsLoggedIn(true);
            setCurrentRoom(storedRoom);
            setName(storedName); // Sätt det sparade namnet
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

    const handleJoinRoom = (roomName: string) => {
        if (!name.trim()) {
            console.error("Name is required to join a room.");
            return;
        }

        socket.emit("enterRoom", { name, room: roomName });
        localStorage.setItem("chatName", name);
        localStorage.setItem("chatRoom", roomName);
        setCurrentRoom(roomName);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("chatName");
        localStorage.removeItem("chatRoom");
        setIsLoggedIn(false);
        setCurrentRoom(null);
    };



    return (
        <SocketProvider>
            {isLoggedIn ? (
                <>
                    <DraggableWrapper>
                        <ChatApp onLeave={handleLogout} />
                    </DraggableWrapper>
                    {videoExists && <VideoParent />}
                </>
            ) : (<>
                <JoinForm name={name} setName={setName} />
                <RoomList onJoinRoom={handleJoinRoom} />
                </>
            )}
        </SocketProvider>
    );
};

export default App;