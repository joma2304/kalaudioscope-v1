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
import CopyInviteLinkButton from "./ChatContainer/CopyInviteLinkButton";
import { Rnd } from "react-rnd";

interface Message {
    userId: string;
    firstName: string;
    lastName: string;
    text: string;
    time: string;
}

interface User {
    userId: string;
    firstName: string;
    lastName: string;
}

interface ChatAppProps {
    onLeave: () => void;
    userId: string;
    room: string;
    password?: string;
}

const ChatApp: React.FC<ChatAppProps> = ({ onLeave, userId, room, password }) => {
    const socket = useSocket();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const usersRef = useRef<User[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [activity, setActivity] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [displayChat, setDisplayChat] = useState(true);
    const hasJoinedRef = useRef(false);

    useEffect(() => {
        usersRef.current = users;
    }, [users]);

    // Sätt alltid upp listeners först!
    useEffect(() => {
        const handleMessage = (data: Message) => {
            setMessages((prev) => [...prev, data]);
            setActivity("");
        };

        const handleUserList = ({ users }: { users: User[] }) => {
            setUsers(users);
        };

        const handleActivity = (userId: string | null) => {
            if (!userId) {
                setActivity("");
                return;
            }
            const user = usersRef.current.find(u => u.userId === userId);
            setActivity(user ? `${user.firstName} ${user.lastName} skriver...` : "Någon skriver...");
        };

        socket.on("message", handleMessage);
        socket.on("userList", handleUserList);
        socket.on("activity", handleActivity);

        return () => {
            socket.off("message", handleMessage);
            socket.off("userList", handleUserList);
            socket.off("activity", handleActivity);
        };
    }, [socket]);

    // Gör join när ChatApp mountas och userId/room finns
    useEffect(() => {
        if (!hasJoinedRef.current && userId && room) {
            socket.emit("enterRoom", { userId, room, password });
            hasJoinedRef.current = true;
        }
    }, [socket, userId, room, password]);

    // Hantera scrollning av chattfönstret
    const chatRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && userId) {
            await sendMessageToServer({
                userId,
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

        socket.emit("leaveRoom", { userId, room });

        setMessages([]);
        setUsers([]);
        setActivity("");

        onLeave();
    };

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const handleTyping = () => {
        if (!isTyping) {
            socket.emit("activity", userId);
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
                    <button onClick={() => setDisplayChat(!displayChat)} className="toggle-chat">
                        {displayChat ? (
                            <> <CircleX />Hide Chat</>
                        ) : (
                            <><MessageSquareIcon />Show Chat</>
                        )}
                    </button>
                </div>
            </div>
            <div className="font-bold p-2 ">
                <div className="chat-bounds">
                    {displayChat && (
                        <>
                            <Rnd
                                className="chat-container cursor-move"
                                bounds="window" // Begränsa rörelsen till fönstret
                                minWidth={325}
                                minHeight={679}
                                default={{
                                    x: 10, // Startposition med 10px marginal från vänster
                                    y: 10, // Startposition med 10px marginal från toppen
                                    width: 400,
                                    height: 679,
                                }}
                                onDrag={(e, d) => {
                                    const minX = 10; // Minsta avstånd från vänster
                                    const minY = 10; // Minsta avstånd från toppen
                                    const maxX = window.innerWidth - d.node.offsetWidth - 10; // Max avstånd från höger
                                    const maxY = window.innerHeight - d.node.offsetHeight - 10; // Max avstånd från botten

                                    // Begränsa X-position
                                    if (d.x < minX) {
                                        d.node.style.left = `${minX}px`;
                                    } else if (d.x > maxX) {
                                        d.node.style.left = `${maxX}px`;
                                    }

                                    // Begränsa Y-position
                                    if (d.y < minY) {
                                        d.node.style.top = `${minY}px`;
                                    } else if (d.y > maxY) {
                                        d.node.style.top = `${maxY}px`;
                                    }
                                }}
                            >
                                <MessageList messages={messages} userId={userId} chatRef={chatRef} roomId={room} />
                                <ActivityIndicator activity={activity} />
                                <MessageForm
                                    message={message}
                                    setMessage={setMessage}
                                    sendMessage={sendMessage}
                                    handleTyping={handleTyping}
                                />
                                <UserList users={users} />
                                <LeaveChatButton leaveChat={leaveChat} />
                                <CopyInviteLinkButton room={room} password={password} />
                            </Rnd>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatApp;