import { useState, useEffect } from "react";
import { SocketProvider, useSocket } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Lobby/JoinForm";
import RoomList from "./components/Lobby/RoomList";
import DraggableWrapper from "./components/DraggableWrapper";
import StreamViewer from "./components/Stream/StreamViewer";

const testStreams = [
    { label: "Angle 1", url: "/videos/angle1.mp4" },
    { label: "Angle 2", url: "/videos/angle2.mp4" },
    { label: "Angle 3", url: "/videos/angle3.mp4" },
    { label: "Angle 4", url: "/videos/angle4.mp4" }
];

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [videoExists, setVideoExists] = useState(false);
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
                    setVideoExists(false);
                }
            } catch (error) {
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
            {isLoggedIn && currentRoom ? (
                <>
                    <DraggableWrapper>
                        <ChatApp
                            onLeave={handleLogout}
                            name={name}
                            room={currentRoom}
                        />
                    </DraggableWrapper>
                    {videoExists && <StreamViewer sources={testStreams} />}
                </>
            ) : (
                <div className="lobby-view">
                    <JoinForm
                        name={name}
                        setName={setName}
                        onJoinSuccess={(roomName) => {
                            setCurrentRoom(roomName);
                            setIsLoggedIn(true);
                            // Sätt även name i state om det inte redan är satt
                            setName(localStorage.getItem("chatName") || name);
                        }}
                    />
                    <RoomList onJoinRoom={handleJoinRoom} />
                </div>
            )}
        </SocketProvider>
    );
};

export default App;
