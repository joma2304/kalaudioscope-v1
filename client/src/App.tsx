import { useState, useEffect } from "react";
import { SocketProvider, useSocket } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Lobby/JoinForm";
import RoomList from "./components/Lobby/RoomList";
import DraggableWrapper from "./components/DraggableWrapper";
import StreamViewer from "./components/Stream/StreamViewer";
import toast, { Toaster } from 'react-hot-toast';
import NameInput from "./components/Lobby/NameInput";

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
    const handleJoinRoom = (
        roomName: string,
        password?: string,
        callback?: (result: { success: boolean; message?: string }) => void
    ) => {
        if (!name.trim()) {
            toast.error("You must enter your name!");
            return;
        }
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

                toast.success("Successfully joined the room!");
            } else {
                toast.error(response.message || "Failed to join the room.");
            }
            if (callback) callback(response);
        });
    };

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
        localStorage.removeItem("chatName");
        localStorage.removeItem("chatRoom");
    };

    return (
        <SocketProvider>
            <>
                <Toaster />
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
                        {videoExists && <StreamViewer sources={testStreams} />}
                    </>
                ) : (
                    <div className="lobby-view">
                        <NameInput name={name} setName={setName} />
                        <JoinForm
                            name={name}
                            setName={setName}
                            onJoinSuccess={handleJoinSuccess}
                        />
                        <RoomList onJoinRoom={handleJoinRoom} name={name} />
                    </div>
                )}
            </>
        </SocketProvider>
    );
};

export default App;
