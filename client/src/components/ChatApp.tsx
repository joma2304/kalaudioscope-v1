import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import "./ChatApp.css";
import { LogOut, SendHorizonal, CircleX, MessageSquareIcon } from "lucide-react";

import JoinForm from "./JoinForm";
import MessageList from "./MessageList";
import MessageForm from "./MessageForm";
import UserList from "./UserList";
import ActivityIndicator from "./ActivityIndicator";
import LeaveChatButton from "./LeaveChatButton";
import MockStream from "./MockStream";

import { Canvas } from '@react-three/fiber';

import Video360 from "./Video360"; // Importera Video360-komponenten 
import { OrbitControls } from "@react-three/drei";



interface Message {
    name: string;
    text: string;
    time: string;
}

const ChatApp = () => {
    const socket = useSocket();
    const [name, setName] = useState("");
    const [ticketNumber, setTicketNumber] = useState("");
    const [room, setRoom] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<string[]>([]);
    const [activity, setActivity] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [lastLeftTime, setLastLeftTime] = useState<number | null>(null); // Tidsstämpel för senaste lämning
    const [hasLeft, setHasLeft] = useState(false); // För att hålla reda på om användaren lämnat via knappen
    const [error, setError] = useState(""); // För felmeddelanden
    const [displayChat, setDisplayChat] = useState(true); // För att visa eller dölja chattfönstret


    // Funktioner för att hantera inloggning och anslutning till rummet
    useEffect(() => {
        const storedName = localStorage.getItem("chatName");
        const storedRoom = localStorage.getItem("chatRoom");

        if (storedName && storedRoom) {
            setName(storedName);
            setRoom(storedRoom);

            socket.emit("enterRoom", { name: storedName, room: storedRoom });

            setShowChat(true);
            setShowHeader(false);

            // Kontrollera om användaren lämnat nyligen, och hantera eventuellt meddelande
            if (lastLeftTime && Date.now() - lastLeftTime < 60000) {
                setHasLeft(false); // Om senaste lämning var mindre än 1 minut, ignorera lämning/återanslut
            }
        }

        const handleMessage = (data: Message) => {
            setMessages((prev) => [...prev, data]);
            setActivity("");
        };

        const handleUserList = ({ users }: { users: { name: string }[] }) => {
            setUsers(users.map((user) => user.name));
        };

        const handleActivity = (name: string | null) => {
            setActivity(name ? `${name} skriver...` : "");
        };

        socket.on("message", handleMessage);
        socket.on("userList", handleUserList);
        socket.on("activity", handleActivity);

        return () => {
            socket.off("message", handleMessage);
            socket.off("userList", handleUserList);
            socket.off("activity", handleActivity);
        };
    }, [socket, lastLeftTime]);

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Du måste ange ett namn!");
            return;
        }

        if (ticketNumber.length !== 10) {
            setError("Biljettnumret måste vara exakt 10 siffror!");
            return;
        }

        const room = ticketNumber.slice(0, 4); // De första 4 siffrorna avgör rummet

        // Spara i localStorage
        localStorage.setItem("chatName", name);
        localStorage.setItem("chatRoom", room);

        console.log("Joining room:", { name, room }); // Logga room här!


        // Skicka anslutningshändelse till servern
        socket.emit("enterRoom", { name, room });
        setRoom(room); // Säkerställ att room sätts här

        setShowChat(true);
        setShowHeader(false);
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && message) {
            socket.emit("message", { name, text: message });
            setMessage("");
        }
    };

    const leaveChat = () => {
        console.log("Leaving room:", { name, room }); // Lägg till denna logg

        if (!room) {
            console.error("Room is empty, cannot leave!");
            return;
        }

        socket.emit("leaveRoom", { name, room });

        localStorage.removeItem("chatName");
        localStorage.removeItem("chatRoom");

        setMessages([]);
        setUsers([]);
        setActivity("");
        setShowChat(false);
        setShowHeader(true);
        setName("");
        setRoom("");

        // Spara senaste lämningstid och markera att användaren lämnat
        setLastLeftTime(Date.now());
        setHasLeft(true);
    };

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTyping = () => {
        if (!isTyping) {
            socket.emit("activity", name);
            setIsTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("activity", null);
            setIsTyping(false);
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <>
            <div>
                {showChat &&
                    <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 0, 0.1] }}>
                        {/* Lägg till OrbitControls för att möjliggöra interaktivitet */}
                        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3}
                            maxPolarAngle={Math.PI / 1.5} />
                        <Video360 videoSrc="https://cdn.bitmovin.com/content/assets/playhouse-vr/progressive.mp4" />
                    </Canvas>

                }
                <div className="toggle-chat-container">
                    {showChat && (
                        <button onClick={() => setDisplayChat(!displayChat)} className="toggle-chat">
                            {displayChat ? (
                                <> <CircleX /></>
                            ) : (
                                <><MessageSquareIcon />Visa chatt</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {displayChat && (
                <div>
                    {showHeader && (
                        <JoinForm
                            name={name}
                            setName={setName}
                            ticketNumber={ticketNumber}
                            setTicketNumber={setTicketNumber}
                            joinRoom={joinRoom}
                            error={error}
                        />
                    )}

                    {!showChat && !showHeader && <p>Ansluter till rummet...</p>}

                    {showChat && (
                        <>
                            <div className="chat-container">
                                <MessageList messages={messages} name={name} chatRef={chatRef} />
                                <ActivityIndicator activity={activity} />
                                <MessageForm
                                    message={message}
                                    setMessage={setMessage}
                                    sendMessage={sendMessage}
                                    handleTyping={handleTyping}
                                />
                                <UserList users={users} />
                                <LeaveChatButton leaveChat={leaveChat} />
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatApp;
