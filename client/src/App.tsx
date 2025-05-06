import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SocketProvider, useSocket } from "./context/SocketContext";
import { UserProvider } from "./context/UserContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Lobby/JoinForm";
import RoomList from "./components/Lobby/RoomList";
import DraggableWrapper from "./components/DraggableWrapper";
import StreamViewer from "./components/Stream/StreamViewer";
import toast, { Toaster } from 'react-hot-toast';
import Header from "./components/Header/header";

const testStreams = [
    { label: "Angle 1", url: "/videos/angle1.mp4" },
    { label: "Angle 2", url: "/videos/angle2.mp4" },
    { label: "Angle 3", url: "/videos/angle3.mp4" },
    { label: "Angle 4", url: "/videos/angle4.mp4" }
];

const getUserId = () => {
    const authUser = localStorage.getItem("authUser");
    if (!authUser) return "";
    try {
        return JSON.parse(authUser).userId || "";
    } catch {
        return "";
    }
};

const AppContent: React.FC = () => {
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [videoExists, setVideoExists] = useState(false);
    const [roomPassword, setRoomPassword] = useState<string | undefined>();
    const [pendingRoom, setPendingRoom] = useState<string | null>(null);
    const [userId, setUserId] = useState(getUserId());
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("authUser"));
    const [isJoined, setIsJoined] = useState(false);
    const socket = useSocket();

    const [searchParams, setSearchParams] = useSearchParams();

    // Uppdatera isLoggedIn och userId när authUser ändras (t.ex. i annan flik)
    useEffect(() => {
        const checkAuth = () => {
            const authUser = localStorage.getItem("authUser");
            setIsLoggedIn(!!authUser);
            setUserId(authUser ? JSON.parse(authUser).userId : "");
        };

        window.addEventListener("storage", checkAuth);
        return () => window.removeEventListener("storage", checkAuth);
    }, []);

    // Hantera länk med ?room=...
    useEffect(() => {
        const roomFromUrl = searchParams.get("room");
        const passwordFromUrl = searchParams.get("password");
        if (roomFromUrl) {
            setPendingRoom(roomFromUrl);
            setRoomPassword(passwordFromUrl || undefined);
        }
    }, [searchParams]);

    // När pendingRoom finns och userId är satt, joina automatiskt
    useEffect(() => {
        if (userId && pendingRoom) {
            handleJoinRoom(pendingRoom, roomPassword);
            setPendingRoom(null);
            // Ta bort room och password från URL
            searchParams.delete("room");
            searchParams.delete("password");
            setSearchParams(searchParams, { replace: true });
        }
    }, [userId, pendingRoom, roomPassword, searchParams, setSearchParams]);

    useEffect(() => {
        const storedRoom = localStorage.getItem("chatRoom");
        const storedPassword = localStorage.getItem("chatRoomPassword");

        if (userId && storedRoom) {
            setCurrentRoom(storedRoom);
            setRoomPassword(storedPassword || undefined);
        } else {
            setCurrentRoom(null);
            setRoomPassword(undefined);
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
    }, [userId]);

    // När man joinar ett befintligt rum (från RoomList)
    const handleJoinRoom = (
        roomName: string,
        password?: string,
        callback?: (result: { success: boolean; message?: string }) => void
    ) => {
        if (!userId) {
            toast.error("You must be logged in!");
            return;
        }
        socket.emit("enterRoom", { userId, room: roomName, password }, (response: { success: boolean; message?: string }) => {
            if (response.success) {
                setCurrentRoom(roomName);
                setIsJoined(true);
                if (password) {
                    setRoomPassword(password);
                    localStorage.setItem("chatRoomPassword", password);
                } else {
                    setRoomPassword(undefined);
                    localStorage.removeItem("chatRoomPassword");
                }
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
        // Gör INTE setCurrentRoom eller setIsJoined här!
        handleJoinRoom(roomName, password);
    };

    const handleLogout = () => {
        setCurrentRoom(null);
        setRoomPassword(undefined);
        setIsJoined(false);
        localStorage.removeItem("chatRoomPassword");
        localStorage.removeItem("chatRoom");
    };

    return (
        <>
            <Header setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />
            <Toaster />
            {currentRoom && isJoined ? (
                <>
                    <DraggableWrapper>
                        <ChatApp
                            onLeave={handleLogout}
                            userId={userId}
                            room={currentRoom}
                            password={roomPassword}
                        />
                    </DraggableWrapper>
                    {videoExists && <StreamViewer sources={testStreams} />}
                </>
            ) : (
                isLoggedIn && (
                    <div className="lobby-view">
                        <JoinForm
                            userId={userId}
                            onJoinSuccess={handleJoinSuccess}
                        />
                        <RoomList onJoinRoom={handleJoinRoom} userId={userId} />
                    </div>
                )
            )}
        </>
    );
};

const App: React.FC = () => (
    <UserProvider>
        <SocketProvider>
            <AppContent />
        </SocketProvider>
    </UserProvider>
);

export default App;
