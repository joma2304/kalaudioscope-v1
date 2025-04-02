import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import "./ChatApp.css";
import { LogOut, SendHorizonal, CircleX, MessageSquareIcon } from "lucide-react";


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
            {/*Visa och dölj chatten-knapp */}
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
            {displayChat && (
                <div className="container">
                    <h2>Se föreställningen tillsammans i grupp med chatt</h2>
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
                                placeholder="Biljettnummer (10 siffror)"
                                value={ticketNumber}
                                onChange={(e) => {
                                    // Tillåt endast siffror
                                    if (/^\d*$/.test(e.target.value)) {
                                        setTicketNumber(e.target.value);
                                    }
                                }}
                                maxLength={10} // Begränsa till 10 tecken
                                required
                            />

                            {error && <p className="error-message">{error}</p>}

                            <button type="submit">Anslut med chatt</button>
                        </form>
                    )}

                    {!showChat && !showHeader && <p>Ansluter till rummet...</p>}

                    {showChat && (
                        <div className="chat-display" ref={chatRef}>
                            <div className="chat-title">Välkommen!</div>
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`post ${msg.name === "Admin"
                                        ? "post--system"
                                        : msg.name === name
                                            ? "post--right"
                                            : "post--left"
                                        }`}
                                >
                                    <span className="sender">{msg.name !== "Admin" && <strong>{msg.name}</strong>}</span>
                                    <span className="msg">{msg.text}</span>
                                    <em>Kl: {msg.time}</em>
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
                            <button type="submit"><SendHorizonal size={18} /> <span>Skicka</span></button>
                        </form>
                    )}

                    {showChat && <p className="users-in-room">Användare i rummet: <strong>{users.join(", ")}</strong></p>}

                    {showChat && <button onClick={leaveChat} className="leave-chat"> <LogOut size={18} />
                        <span>Lämna rummet</span></button>}

                </div>
            )}
        </>
    );
};

export default ChatApp;
