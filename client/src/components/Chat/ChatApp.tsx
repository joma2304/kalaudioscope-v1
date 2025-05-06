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

interface Message {
    userId: string;
    text: string;
    time: string;
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
    const [users, setUsers] = useState<string[]>([]);
    const [activity, setActivity] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [lastLeftTime, setLastLeftTime] = useState<number | null>(null);
    const [hasLeft, setHasLeft] = useState(false);
    const [error, setError] = useState("");
    const [displayChat, setDisplayChat] = useState(true);

    // Sätt alltid upp listeners först!
    useEffect(() => {
        const handleMessage = (data: { userId: string; text: string; time: string }) => {
            const formattedMessage: Message = {
                userId: data.userId,
                text: data.text,
                time: data.time,
            };
            setMessages((prev) => [...prev, formattedMessage]);
            setActivity("");
        };

        const handleUserList = ({ users }: { users: { userId: string }[] }) => {
            setUsers(users.map((user) => user.userId));
        };

        const handleActivity = (userId: string | null) => {
            setActivity(userId ? `${userId} skriver...` : "");
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

    // Join rummet EFTER att listeners är uppe
    useEffect(() => {
        if (userId && room) {
            setShowChat(false);
            setShowHeader(true);
            socket.emit(
                "enterRoom",
                { userId, room, password },
                (response: { success: boolean; message?: string; users?: { userId: string }[] }) => {
                    if (response?.success) {
                        setShowChat(true);
                        setShowHeader(false);
                        if (response.users) {
                            setUsers(response.users.map(u => u.userId));
                        }
                    } else {
                        setError(response?.message || "Failed to join room.");
                    }
                }
            );

            if (lastLeftTime && Date.now() - lastLeftTime < 60000) {
                setHasLeft(false);
            }
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
        setShowChat(false);
        setShowHeader(true);

        setLastLeftTime(Date.now());
        setHasLeft(true);

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
                                <CopyInviteLinkButton room={room} password={password}/>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatApp;