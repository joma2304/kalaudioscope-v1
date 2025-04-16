import { useState, useEffect } from "react";
import { SocketProvider } from "./context/SocketContext";
import ChatApp from "./components/Chat/ChatApp";
import JoinForm from "./components/Login/JoinForm";
import Lobby from "./components/Login/Lobby";
import DraggableWrapper from "./components/DraggableWrapper";
import StreamViewer from "./components/Stream/StreamViewer";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [videoExists, setVideoExists] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("chatName");
    const storedRoom = localStorage.getItem("chatRoom");
    const storedTicketNumber = localStorage.getItem("ticketNumber");

    if (storedName && storedTicketNumber) {
      setIsLoggedIn(true);
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

  const handleLogout = () => {
    localStorage.removeItem("chatName");
    localStorage.removeItem("chatRoom");
    localStorage.removeItem("ticketNumber");
    setIsLoggedIn(false);
    setCurrentRoom(null);
  };

  const handleJoinRoom = (roomName: string) => {
    setCurrentRoom(roomName);
    localStorage.setItem("chatRoom", roomName);
  };

  // Tillfälliga testvideor
  const testStreams = [
    { label: "Vinkel 1", url: "/videos/angle1.mp4" },
    { label: "Vinkel 2", url: "/videos/angle2.mp4" },
    { label: "Vinkel 3", url: "/videos/angle3.mp4" },
    { label: "Vinkel 4", url: "/videos/angle4.mp4" },
  ];

  return (
    <SocketProvider>
      {isLoggedIn ? (
        currentRoom ? (
          <>
            <DraggableWrapper>
              <ChatApp onLeave={handleLogout} />
            </DraggableWrapper>
            {videoExists && <StreamViewer sources={testStreams} />}
          </>
        ) : (
          <Lobby onJoinRoom={handleJoinRoom} />
        )
      ) : (
        <JoinForm />
      )}
    </SocketProvider>
  );
};

export default App;
