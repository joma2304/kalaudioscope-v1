import { useEffect, useState } from "react";
import "./MessageHistory.css"

interface Message {
    senderId: string;
    firstName: string;
    lastName: string;
    text: string;
    createdAt: string;
}

const MessageHistory = ({ roomId }: { roomId: string }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const authUser = localStorage.getItem("authUser");
    const userId = authUser ? JSON.parse(authUser).userId : "Guest";

    useEffect(() => {
        const fetchMessages = async (roomId: string) => {
            try {
                const res = await fetch(`https://kalaudioscope-test.onrender.com/api/messages/${roomId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                } else {
                    console.error("Failed to fetch messages:", res.status);
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages(localStorage.getItem("chatRoom") || roomId);
    }, [roomId]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div>
            <div className="chat-history">
                {messages
                    .filter(message => message.senderId !== "Admin")
                    .map((message, index) => (
                        <div
                            key={index}
                            className={`message ${message.senderId === userId ? "message--self" : "message--other"}`}
                        >
                            <strong>{message.firstName} {message.lastName}</strong>
                            <hr />
                            <p>{message.text}</p>
                            <small>{formatTime(message.createdAt)}</small>
                        </div>
                    ))}
                {messages.length > 0 &&
                    <p className="chat-history-title">Scroll up for chat history</p>
                }
            </div>
        </div>
    );
};

export default MessageHistory;