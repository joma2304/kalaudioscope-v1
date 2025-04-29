import { useState, useEffect } from "react";
import { SocketProvider, useSocket } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Lobby/JoinForm";
import RoomList from "./components/Lobby/RoomList";
import DraggableWrapper from "./components/DraggableWrapper";
import "./App.css"; // Importera CSS för App
import VideoParent from "./components/Video/VideoParent";


const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [videoExists, setVideoExists] = useState(false);
    const [name, setName] = useState("");
    const [roomPassword, setRoomPassword] = useState<string | undefined>();
    const socket = useSocket();

    useEffect(() => {
        const storedName = localStorage.getItem("chatName");
        const storedRoom = localStorage.getItem("chatRoom");
        const storedPassword = localStorage.getItem("chatRoomPassword");

        if (storedName && storedRoom) {
            setIsLoggedIn(true);
            setCurrentRoom(storedRoom);
            setName(storedName);
            setRoomPassword(storedPassword || undefined);
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

    // När man joinar ett befintligt rum (från RoomList)
    const handleJoinRoom = (roomName: string, password?: string) => {
        if (!name.trim()) return;
        socket.emit("enterRoom", { name, room: roomName, password }, (response: { success: boolean; message?: string }) => {
            if (response.success) {
                setCurrentRoom(roomName);
                setIsLoggedIn(true);
                if (password) {
                    setRoomPassword(password);
                    localStorage.setItem("chatRoomPassword", password);
                } else {
                    setRoomPassword(undefined);
                    localStorage.removeItem("chatRoomPassword");
                }
                localStorage.setItem("chatName", name);
                localStorage.setItem("chatRoom", roomName);

                // Lägg till denna rad:
                socket.emit('getInitialState');
            } else {
                alert(response.message || "Failed to join the room.");
            }
        });
    };

    // När man skapar ett nytt rum (från JoinForm)
    // När man skapar ett nytt rum (från JoinForm)
    const handleJoinSuccess = (roomName: string, password?: string) => {
        setCurrentRoom(roomName);
        setIsLoggedIn(true);
        setName(localStorage.getItem("chatName") || name);
        if (password) {
            setRoomPassword(password);
            localStorage.setItem("chatRoomPassword", password);
        } else {
            setRoomPassword(undefined);
            localStorage.removeItem("chatRoomPassword");
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentRoom(null);
        setRoomPassword(undefined);
        localStorage.removeItem("chatRoomPassword");
        localStorage.removeItem("chatRoom");
        localStorage.removeItem("chatName");
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
                            password={roomPassword}
                        />
                    </DraggableWrapper>
                    {videoExists && <VideoParent />}
                </>
            ) : (
                <div className="lobby-view">
                    <JoinForm
                        name={name}
                        setName={setName}
                        onJoinSuccess={handleJoinSuccess}
                    />
                    <RoomList onJoinRoom={handleJoinRoom} />
                </div>
            )}
        </SocketProvider>
    );
};

export default App;