import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import "./ChatApp.css";
import { CircleX, MessageSquareIcon } from "lucide-react";
import MessageList from "./ChatContainer/MessageList";
import MessageForm from "./ChatContainer/MessageForm";
import UserList from "./ChatContainer/UserList";
import ActivityIndicator from "./ChatContainer/ActivityIndicator";
import LeaveChatButton from "./ChatContainer/LeaveChatButton";
// import MockStream from "./MockStream";
import { sendMessageToServer } from "../../utils/SendMessageToServer";


// Interfaces
interface Message {
    name: string;
    text: string;
    time: string;
}

interface ChatAppProps {
    onLeave: () => void;
}

const ChatApp: React.FC<ChatAppProps> = ({ onLeave }) => {

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
        const storedTicketNumber = localStorage.getItem("ticketNumber");

        if (storedName && storedRoom) {
            setName(storedName);
            setRoom(storedRoom);
            setTicketNumber(storedTicketNumber || ""); // Sätt ticketNumber från localStorage


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

    // Hantera scrollning av chattfönstret
    const chatRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        

        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);


    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && name) {
            await sendMessageToServer({
                name,
                text: message,
                socket,
            });
            setMessage("");
        }
    };

    const leaveChat = () => {
        console.log("Leaving room:", { name, room });

        if (!room) {
            console.error("Room is empty, cannot leave!");
            return;
        }

        socket.emit("leaveRoom", { name, room });

        localStorage.removeItem("chatName");
        localStorage.removeItem("chatRoom");
        localStorage.removeItem("ticketNumber");

        setMessages([]);
        setUsers([]);
        setActivity("");
        setShowChat(false);
        setShowHeader(true);
        setName("");
        setRoom("");
        setTicketNumber("");

        setLastLeftTime(Date.now());
        setHasLeft(true);

        // Anropa onLeave för att uppdatera App.tsx
        onLeave();
    };

    const handleTyping = () => {

        const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    return (
        <>
            <div>

                <div className="toggle-chat-container">
                    {showChat && (
                        <button onClick={() => setDisplayChat(!displayChat)} className="toggle-chat">
                            {displayChat ? (
                                <> <CircleX />Dölj chatt</>
                            ) : (
                                <><MessageSquareIcon />Visa chatt</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {displayChat && (
                <div>
                    {!showChat && <p>Ansluter till rummet...</p>}

                    {showChat && (
                        <>
                            <div className="chat-container" >
                                <MessageList messages={messages} name={name} chatRef={chatRef} roomId={""} />
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