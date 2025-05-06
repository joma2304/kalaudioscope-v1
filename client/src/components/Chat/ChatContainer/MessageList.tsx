import MessageHistory from "./MessageList/MessageHistory";
import React from "react";

interface Message {
    userId: string;
    text: string;
    time: string;
}

interface MessageListProps {
    messages: Message[];
    userId: string;
    chatRef?: React.RefObject<HTMLDivElement | null>;
    roomId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, userId, chatRef, roomId }) => {
    return (
        <div className="chat-display" ref={chatRef}>
            <div className="chat-title">Welcome!</div>

            <MessageHistory roomId={roomId} />

            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`post ${msg.userId === "Admin"
                        ? "post--system"
                        : msg.userId === userId
                            ? "post--right"
                            : "post--left"
                        }`}
                >
                    <span className="sender">{msg.userId !== "Admin" && <strong>{msg.userId} <hr /></strong>}</span>
                    <span className="msg">{msg.text}</span>
                    <em className="sent-time">{msg.time}</em>
                </div>
            ))}
        </div>
    );
};

export default MessageList;