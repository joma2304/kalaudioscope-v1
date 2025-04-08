import { useEffect, useState } from "react";
import "./MessageHistory.css"

const MessageHistory = ({ roomId }: { roomId: string }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const name = localStorage.getItem("chatName") || "Guest"; // Sätt en fallback till "Guest"


    useEffect(() => {
        // Hämtar meddelanden för chattrummet
        const fetchMessages = async (roomId: string) => {
            try {
                const res = await fetch(`http://localhost:3500/api/messages/${roomId}`);
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

        fetchMessages(localStorage.getItem("chatRoom") || roomId); // Använd roomId om inget finns i localStorage
    }, [roomId]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // T.ex. "14:30"
    };

    return (
        <div>
            <div className="chat-history">
                <p className="chat-history-title">Chatthistorik för rummet</p>
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.senderName === name ? "message--self" : "message--other"}`}
                    >
                        <strong>{message.senderName} </strong>
                        <hr />
                        <p>{message.text}</p>
                        <small>{formatTime(message.createdAt)}</small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MessageHistory;