import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import "./ChatApp.css";
import { CircleX, MessageSquareIcon } from "lucide-react";
import MessageList from "./ChatContainer/MessageList";
import MessageForm from "./ChatContainer/MessageForm";
import UserList from "./ChatContainer/UserList";
import ActivityIndicator from "./ChatContainer/ActivityIndicator";
import LeaveChatButton from "./ChatContainer/LeaveChatButton";
import { sendMessageToServer } from "../../utils/SendMessageToServer";

interface Message {
    name: string;
    text: string;
    time: string;
}

interface ChatAppProps {
    onLeave: () => void;
    name: string;
    room: string;
}

const ChatApp: React.FC<ChatAppProps> = ({ onLeave, name, room }) => {
    const socket = useSocket();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<string[]>([]);
    const [activity, setActivity] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [lastLeftTime, setLastLeftTime] = useState<number | null>(null);
    const [hasLeft, setHasLeft] = useState(false);
    const [displayChat, setDisplayChat] = useState(true);

    // Anslut till rummet när komponenten mountas eller när name/room ändras
    useEffect(() => {
        if (name && room) {
            socket.emit("enterRoom", { name, room });
            setShowChat(true);
            setShowHeader(false);

            if (lastLeftTime && Date.now() - lastLeftTime < 60000) {
                setHasLeft(false);
            }
        }
        // eslint-disable-next-line
    }, [socket, name, room]);

    useEffect(() => {
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
        socket.on("roomUsers", handleUserList);
        socket.on("activity", handleActivity);

        return () => {
            socket.off("message", handleMessage);
            socket.off("roomUsers", handleUserList);
            socket.off("activity", handleActivity);
        };
    }, [socket]);

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
        if (!room) {
            console.error("Room is empty, cannot leave!");
            return;
        }

        socket.emit("leaveRoom", { name, room });

        setMessages([]);
        setUsers([]);
        setActivity("");
        setShowChat(false);
        setShowHeader(true);

        setLastLeftTime(Date.now());
        setHasLeft(true);

        onLeave();
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

    return (
        <>
            <div>
                <div className="toggle-chat-container">
                    {showChat && (
                        <button onClick={() => setDisplayChat(!displayChat)} className="toggle-chat">
                            {displayChat ? (
                                <> <CircleX />Hide Chat</>
                            ) : (
                                <><MessageSquareIcon />Show Chat</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {displayChat && (
                <div>
                    {!showChat && <p>Connecting to Room...</p>}

                    {showChat && (
                        <>
                            <div className="chat-container" >
                                <MessageList messages={messages} name={name} chatRef={chatRef} roomId={room} />
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