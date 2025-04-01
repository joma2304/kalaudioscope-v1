import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import "./ChatApp.css";

interface Message {
    name: string;
    text: string;
    time: string;
}

const ChatApp = () => {
    const socket = useSocket();
    const [name, setName] = useState("");
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
        if (name && room) {
            setMessages([]);
            localStorage.setItem("chatName", name);
            localStorage.setItem("chatRoom", room);

            socket.emit("enterRoom", { name, room });

            setShowChat(true);
            setShowHeader(false);
        }
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && message) {
            socket.emit("message", { name, text: message });
            setMessage("");
        }
    };

    const leaveChat = () => {
        localStorage.removeItem("chatName");
        localStorage.removeItem("chatRoom");

        socket.emit("leaveRoom", { name, room });

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
        <div className="container">
            {showHeader && (
                <form onSubmit={joinRoom}>
                    <input
                        type="text"
                        placeholder="Ditt namn"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Rum"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        required
                    />
                    <button type="submit">Anslut</button>
                </form>
            )}

            {!showChat && !showHeader && <p>Ansluter till rummet...</p>}

            {showChat && (
                <div className="chat-display" ref={chatRef}>
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`post ${
                                msg.name === "Admin"
                                    ? "post--system"
                                    : msg.name === name
                                    ? "post--right"
                                    : "post--left"
                            }`}
                        >
                            {msg.name !== "Admin" && <strong>{msg.name}:</strong>}
                            <span>{msg.text}</span>
                            <em>{msg.time}</em>
                        </div>
                    ))}
                </div>
            )}

            {showChat && <p>{activity}</p>}

            {showChat && (
                <form onSubmit={sendMessage}>
                    <input
                        type="text"
                        placeholder="Ditt meddelande"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={() => {
                            if (!typingTimeoutRef.current) {
                                handleTyping();
                            }
                        }}
                        required
                    />
                    <button type="submit">Skicka</button>
                </form>
            )}

            {showChat && <p>Användare i rummet: {users.join(", ")}</p>}

            {showChat && <button onClick={leaveChat}>Lämna chatten</button>}

            {/* Meddelande om återanslutning */}
            {hasLeft && Date.now() - lastLeftTime! > 60000 && (
                <div className="rejoin-notice">
                    <p>Du har lämnat rummet och återanslutit!</p>
                </div>
            )}
        </div>
    );
};

export default ChatApp;
