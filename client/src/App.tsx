import { useState, useEffect } from "react";
import { SocketProvider, useSocket } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Lobby/JoinForm";
import RoomList from "./components/Lobby/RoomList";
import DraggableWrapper from "./components/DraggableWrapper";
import "./App.css"; // Importera CSS för App
import VideoParent from "./components/Video/VideoParent";
import toast, { Toaster } from "react-hot-toast"; // Importera React Hot Toast
import { useSearchParams } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import Header from "./components/Header/Header";


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
    };

    const handleLogout = () => {
        setCurrentRoom(null);
        setRoomPassword(undefined);
        localStorage.removeItem("chatRoomPassword");
        localStorage.removeItem("chatRoom");
    };

    return (
        <>
            <Header setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />
            <Toaster />
            {currentRoom ? (
                <>
                    <DraggableWrapper>
                        <ChatApp
                            onLeave={handleLogout}
                            userId={userId}
                            room={currentRoom}
                            password={roomPassword}
                        />
                    </DraggableWrapper>
                    {videoExists && <VideoParent />}
                </>
            ) : (
                isLoggedIn && (
                    <div className="lobby-view">
                        <JoinForm
                            userId={userId}
                            onJoinSuccess={handleJoinSuccess}
                        />
                        <RoomList onJoinRoom={handleJoinSuccess} userId={userId} />
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