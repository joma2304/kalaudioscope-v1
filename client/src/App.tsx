import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { UserProvider, useUser } from "./context/UserContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Lobby/JoinForm";
import RoomList from "./components/Lobby/RoomList";
import StreamViewer from "./components/Stream/StreamViewer";
import toast, { Toaster } from 'react-hot-toast';
import Header from "./components/Header/Header";
import { jwtDecode } from "jwt-decode";
import { useSocket } from "./context/SocketContext"; // Lägg till denna import

/* const defaultStreams = [
    { label: "Angle 1", url: "/videos/angle1.mp4" },
    { label: "Angle 2", url: "/videos/angle2.mp4" },
    { label: "Angle 3", url: "/videos/angle3.mp4" },
    { label: "Angle 4", url: "/videos/angle4.mp4" }
]; */
const defaultStreams = [
    { label: "Angle 1", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
    { label: "Angle 2", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
    { label: "Angle 3", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
    { label: "Angle 4", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }
]; 
const getStreams = () => {
    const stored = localStorage.getItem("customStreams");
    return stored ? JSON.parse(stored) : defaultStreams;
};

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
    const [searchParams, setSearchParams] = useSearchParams();
    const [testStreams, setTestStreams] = useState(getStreams());
    const { logout } = useUser();
    const socket = useSocket(); // Lägg till denna rad

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

    useEffect(() => {
        const interval = setInterval(() => {
            const authUser = localStorage.getItem("authUser");
            if (!authUser) return;

            try {
                const { token } = JSON.parse(authUser);
                if (!token) return;

                const { exp } = jwtDecode<{ exp: number }>(token);
                if (!exp || Date.now() >= exp * 1000) {
                    // Token är utgången eller saknar exp
                    localStorage.removeItem("authUser");
                    setIsLoggedIn(false);
                    setUserId("");
                    logout(); // <-- Lägg till denna rad!
                    toast.error("Session expired. You have been logged out.");

                }
            } catch {
                // Om något går fel, logga ut ändå
                localStorage.removeItem("authUser");
                setIsLoggedIn(false);
                setUserId("");
                logout(); // <-- Lägg till denna rad!
                toast.error("Session expired. You have been logged out.");
  
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [logout]);

    useEffect(() => {
        const onStorage = () => setTestStreams(getStreams());
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        const onCustomStreamsChanged = () => setTestStreams(getStreams());
        window.addEventListener("customStreamsChanged", onCustomStreamsChanged);
        return () => window.removeEventListener("customStreamsChanged", onCustomStreamsChanged);
    }, []);

    // Hantera länk med ?room=...
    useEffect(() => {
        const roomFromUrl = searchParams.get("room");
        const passwordFromUrl = searchParams.get("password");

        if (roomFromUrl) {
            if (!userId) {
                // Om användaren inte är inloggad, visa toast och spara rumsinformationen i pendingRoom
                setPendingRoom(roomFromUrl);
                setRoomPassword(passwordFromUrl || undefined);
                toast.error("You need to log in to join the room.");
            } else {
                // Om användaren är inloggad, spara rumsinformationen i localStorage och anslut
                localStorage.setItem("chatRoom", roomFromUrl);
                if (passwordFromUrl) {
                    localStorage.setItem("chatRoomPassword", passwordFromUrl);
                } else {
                    localStorage.removeItem("chatRoomPassword");
                }
                setCurrentRoom(roomFromUrl);
                setRoomPassword(passwordFromUrl || undefined);

                // Ta bort room och password från URL
                searchParams.delete("room");
                searchParams.delete("password");
                setSearchParams(searchParams, { replace: true });
                toast.success("Joined room successfully!");
            }
        }
    }, [searchParams, userId]);

    // När pendingRoom finns och userId är satt, gå till rummet automatiskt
    useEffect(() => {
        if (userId && pendingRoom) {
            setCurrentRoom(pendingRoom);
            setPendingRoom(null);
            // Ta bort room och password från URL
            searchParams.delete("room");
            searchParams.delete("password");
            setSearchParams(searchParams, { replace: true });
        }
    }, [userId, pendingRoom, searchParams, setSearchParams]);

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
                setVideoExists(response.ok && response.headers.get("content-type") !== "text/html");
            } catch {
                setVideoExists(false);
            }
        };
        checkVideoFile();
    }, [userId]);

    // Ny korrekt join-funktion
    const handleJoinRoom = (roomName: string, password?: string, callback?: (result: { success: boolean; message?: string }) => void) => {
        socket.emit("enterRoom", { userId, room: roomName, password }, (result: { success: boolean; message?: string }) => {
            if (result.success) {
                handleJoinSuccess(roomName, password);
            }
            if (callback) callback(result);
        });
    };

    // När man skapar ett nytt rum (från JoinForm)
    const handleJoinSuccess = (roomName: string, password?: string) => {
        setCurrentRoom(roomName);
        setRoomPassword(password);
        localStorage.setItem("chatRoom", roomName);
        if (password) {
            localStorage.setItem("chatRoomPassword", password);
        } else {
            localStorage.removeItem("chatRoomPassword");
        }
        window.dispatchEvent(new Event("roomListChanged")); // <-- Lägg till denna rad
    };

    const handleLogout = () => {
        setCurrentRoom(null);
        setRoomPassword(undefined);
        localStorage.removeItem("chatRoomPassword");
        localStorage.removeItem("chatRoom");
    };

    return (
        <>
            {!currentRoom && <Header setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />}
            <Toaster />
            {currentRoom ? (
                <>
                    <ChatApp
                        onLeave={handleLogout}
                        userId={userId}
                        room={currentRoom}
                        password={roomPassword}
                    />
                    {videoExists && <StreamViewer sources={testStreams} userId={userId} />}
                </>
            ) : (
                isLoggedIn ? (
                    <div className="lobby-view">
                        <JoinForm
                            userId={userId}
                            onJoinSuccess={handleJoinSuccess}
                        />
                        <RoomList onJoinRoom={handleJoinRoom} userId={userId} />
                    </div>
                ) : (
                    <div
                        style={{
                            minHeight: "70vh",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <img
                            src="/kalaudioscope-logo.png" // eller "/logo.svg"
                            alt="Opera Chat Logo"
                            style={{
                                width: "320px",
                                maxWidth: "90vw",
                                marginBottom: "2rem",
                                filter: "drop-shadow(0 8px 32px rgba(99,102,241,0.18))"
                            }}
                        />

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