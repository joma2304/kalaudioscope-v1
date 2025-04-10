import { useState, useEffect } from "react";
import { SocketProvider } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Login/JoinForm";
import VideoParent from "./components/Video/VideoParent";

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem("chatName");
        const storedRoom = localStorage.getItem("chatRoom");
        const storedTicketNumber = localStorage.getItem("ticketNumber");

        if (storedName && storedRoom && storedTicketNumber) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
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
                    <ChatApp onLeave={handleLogout} />
                    <VideoParent />
                </>
            ) : (
                <JoinForm />
            )}
        </SocketProvider>
    );
};

export default App;
